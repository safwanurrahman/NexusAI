import { useState, useCallback } from "react";

// The base URL for your FastAPI backend
const BACKEND_URL = "http://127.0.0.1:8000";

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

  // Helper to wait between polling attempts
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const search = useCallback(async (keyword: string, _country: string = "all") => {
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage("Connecting to research assistant...");

    // Update history locally
    setKeywordHistory((prev) => {
      const filtered = prev.filter((k) => k !== keyword);
      return [keyword, ...filtered].slice(0, 10);
    });

    try {
      // 1. START THE TASK (Trigger the Worker)
      const response = await fetch(`${BACKEND_URL}/research`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ query: keyword.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Backend Offline (${response.status})`);
      }

      const initialData: BackendResponse = await response.json();

      // If Cache Hit, results come back immediately
      if (initialData.status === "success" && initialData.data) {
        setStatusMessage("Found matching insights in cache!");
        setArticles(initialData.data.map(item => ({
          title: item.title,
          summary: item.summary,
          author: item.author || "LinkedIn Contributor",
          url: item.link,
        })));
        await sleep(800); // Brief pause to let user see the cache message
        setIsLoading(false);
        return;
      }

      // 2. POLLING LOGIC: Listen to the background worker
      const taskId = initialData.task_id;
      if (!taskId) throw new Error("No Task ID received from server.");

      let isFinished = false;
      let attempts = 0;
      const maxAttempts = 30; // Max wait ~60 seconds

      // Initial worker phase message
      setStatusMessage("Searching LinkedIn for relevant posts...");

      while (!isFinished && attempts < maxAttempts) {
        attempts++;

        // Update narrative status based on how long it's taking
        if (attempts === 3) setStatusMessage("Analyzing post content...");
        if (attempts === 6) setStatusMessage("Summarizing insights with AI...");
        if (attempts === 12) setStatusMessage("Polishing final summaries...");

        await sleep(2000); // Wait 2 seconds before checking again

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
          await sleep(500); // Smooth transition to showing results
          isFinished = true;
        } else if (pollData.status === "error") {
          throw new Error(pollData.message || "AI Worker failed.");
        }
        // If status is 'pending', the loop continues naturally
      }

      if (attempts >= maxAttempts) {
        throw new Error("Search timed out. The worker is taking too long.");
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setError(message);
      setArticles([]);
    } finally {
      setIsLoading(false);
      setStatusMessage(""); // Reset message for next search
    }
  }, []);

  const clearHistory = useCallback(() => {
    setKeywordHistory([]);
  }, []);

  return { articles, isLoading, error, keywordHistory, search, clearHistory, statusMessage };
}