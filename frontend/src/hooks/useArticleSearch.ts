import { useState, useCallback, useRef } from "react";

// Fallback for local development
// --- MANUAL BACKEND TOGGLE ---

// 🏠 LOCAL MODE (Keep this active for now)
export const BACKEND_URL = "http://127.0.0.1:8000";

// ☁️ CLOUD MODE (Keep this commented out until local is 100% fixed)
// export const BACKEND_URL = "https://nexusai-production-370f.up.railway.app";

interface Article {
  title: string;
  summary: string;
  author: string;
  url: string;
  platform: "linkedin" | "twitter";
}

interface BackendArticle {
  title: string;
  link: string;
  author: string;
  summary: string;
  platform: "linkedin" | "twitter";
}

interface BackendResponse {
  status: "success" | "processing" | "pending" | "error";
  data?: BackendArticle[];
  task_id?: string;
  message?: string;
}

export function useArticleSearch() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordHistory, setKeywordHistory] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  
  // 🆔 NEW: Store the Task ID for the kill switch
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  // 🚩 NEW: A ref to catch the stop signal inside the async loop
  const stopSignal = useRef(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // --- NEW: Export to JSON Function (Fixed using Blob) ---
  const exportToJson = useCallback(() => {
    if (articles.length === 0) return;
    const blob = new Blob([JSON.stringify(articles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `research_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  }, [articles]);

  // 🛑 NEW: The Stop Function
  const stopSearch = useCallback(async () => {
    if (!activeTaskId) return;

    try {
      stopSignal.current = true; // Tell the local loop to stop polling
      setStatusMessage("Stopping research...");
      
      await fetch(`${BACKEND_URL}/research/stop/${activeTaskId}`, {
        method: "POST",
      });

      setActiveTaskId(null);
      setIsLoading(false);
      setStatusMessage("Research cancelled.");
      await sleep(1000);
      setStatusMessage("");
    } catch (err) {
      console.error("Failed to stop task:", err);
    }
  }, [activeTaskId]);

  const search = useCallback(async (keyword: string, country: string = "all") => {
    if (!keyword.trim()) return;

    stopSignal.current = false; // Reset signal
    setIsLoading(true);
    setError(null);
    setStatusMessage("Connecting to research assistant...");

    setKeywordHistory((prev) => {
      const filtered = prev.filter((k) => k !== keyword);
      return [keyword, ...filtered].slice(0, 10);
    });

    try {
      console.log("Calling backend at:", BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/research`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ query: keyword.trim(), country: country, platform: "both" }),
      });

      if (!response.ok) throw new Error(`Server Error (${response.status})`);
      const initialData: BackendResponse = await response.json();

      if (initialData.status === "success" && initialData.data) {
        setStatusMessage("Found matching insights in cache!");
        setArticles(initialData.data.map(item => ({
          title: item.title,
          summary: item.summary,
          author: item.author || "Contributor",
          url: item.link,
          platform: item.platform || "linkedin",
        })));
        await sleep(800);
        setIsLoading(false);
        return;
      }

      const taskId = initialData.task_id;
      if (!taskId) throw new Error("No Task ID received.");
      setActiveTaskId(taskId); 

      let isFinished = false;
      let attempts = 0;
      const maxAttempts = 30; 

        while (!isFinished && attempts < maxAttempts) {
        if (stopSignal.current) break; // Check if user hit stop

        attempts++;
        if (attempts === 4) setStatusMessage("Searching LinkedIn & Twitter...");
        if (attempts === 10) setStatusMessage("Summarizing insights with AI...");

        await sleep(2500);
        if (stopSignal.current) break; // Guard: check again after sleep in case stop was triggered

        const pollResponse = await fetch(`${BACKEND_URL}/results/${taskId}`);
        const pollData: BackendResponse = await pollResponse.json();

        if (stopSignal.current) break; // Guard: stop before committing data to state

        if (pollData.status === "success" && pollData.data) {
          setStatusMessage("Research complete!");
          setArticles(pollData.data.map(item => ({
            title: item.title,
            summary: item.summary,
            author: item.author || "Contributor",
            url: item.link,
            platform: item.platform || "linkedin",
          })));
          isFinished = true;
        } else if (pollData.status === "error") {
          throw new Error(pollData.message || "AI Worker failed.");
        }
      }

      if (attempts >= maxAttempts && !isFinished) throw new Error("Search timed out.");

    } catch (err) {
      if (!stopSignal.current) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setArticles([]);
      }
    } finally {
      setIsLoading(false);
      setActiveTaskId(null);
      if (!stopSignal.current) setStatusMessage("");
    }
  }, []);

  const clearHistory = useCallback(() => setKeywordHistory([]), []);

  return { articles, isLoading, error, keywordHistory, search, stopSearch, clearHistory, statusMessage, exportToJson };
}