import { useState, useCallback } from "react";

// Fallback for local development
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

// THE "OR" CONDITION: Uses VITE_BACKEND_URL if present (Cloud), 
// otherwise defaults to your local machine (127.0.0.1).
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL;

interface Article {
  title: string;
  summary: string;
  author: string;
  url: string;
}

interface BackendArticle {
  title: string;
  link: string;
  author: string;
  summary: string;
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

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // --- NEW: Export to JSON Function ---
  const exportToJson = useCallback(() => {
    if (articles.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(articles, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `research_${new Date().getTime()}.json`);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [articles]);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage("Connecting to research assistant...");

    setKeywordHistory((prev) => {
      const filtered = prev.filter((k) => k !== keyword);
      return [keyword, ...filtered].slice(0, 10);
    });

    try {
      // 1. Trigger the Research Task
      console.log("Calling backend at:", BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/research`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ query: keyword.trim() }),
      });

      if (!response.ok) throw new Error(`Server Error (${response.status})`);

      const initialData: BackendResponse = await response.json();

      // Handle Cache Hit
      if (initialData.status === "success" && initialData.data) {
        setStatusMessage("Found matching insights in cache!");
        setArticles(initialData.data.map(item => ({
          title: item.title,
          summary: item.summary,
          author: item.author || "LinkedIn Contributor",
          url: item.link,
        })));
        await sleep(800);
        setIsLoading(false);
        return;
      }

      // 2. Polling Logic for Background Worker
      const taskId = initialData.task_id;
      if (!taskId) throw new Error("No Task ID received from server.");

      let isFinished = false;
      let attempts = 0;
      const maxAttempts = 30; 

      setStatusMessage("Searching LinkedIn for relevant posts...");

      while (!isFinished && attempts < maxAttempts) {
        attempts++;
        if (attempts === 4) setStatusMessage("Analyzing post content...");
        if (attempts === 10) setStatusMessage("Summarizing insights with AI...");

        await sleep(2500); 

        const pollResponse = await fetch(`${BACKEND_URL}/results/${taskId}`);
        const pollData: BackendResponse = await pollResponse.json();

        if (pollData.status === "success" && pollData.data) {
          setStatusMessage("Research complete!");
          setArticles(pollData.data.map(item => ({
            title: item.title,
            summary: item.summary,
            author: item.author || "LinkedIn Contributor",
            url: item.link,
          })));
          isFinished = true;
        } else if (pollData.status === "error") {
          throw new Error(pollData.message || "AI Worker failed.");
        }
      }

      if (attempts >= maxAttempts) throw new Error("Search timed out.");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setArticles([]);
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  }, []);

  const clearHistory = useCallback(() => setKeywordHistory([]), []);

  return { articles, isLoading, error, keywordHistory, search, clearHistory, statusMessage, exportToJson };
}
//todo: add a function to export the articles to a pdf and make 
//todo: add a function to export the articles to a json file and make it downloadable
// connect to the railway