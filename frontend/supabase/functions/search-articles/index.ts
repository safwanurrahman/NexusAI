import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Article {
  title: string;
  snippet: string;
  author: string;
  url: string;
}

// In-memory cache with TTL
const cache = new Map<string, { data: Article[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): Article[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: Article[]) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch LinkedIn articles via Proxycurl's search endpoint.
 * Falls back to mock data if the API key is not configured or the call fails.
 */
async function fetchLinkedInArticles(
  keyword: string,
  country: string
): Promise<Article[]> {
  const PROXYCURL_API_KEY = Deno.env.get("PROXYCURL_API_KEY");

  if (!PROXYCURL_API_KEY) {
    console.warn("PROXYCURL_API_KEY not set — returning sample data");
    return generateSampleArticles(keyword, country);
  }

  try {
    // Proxycurl Person Search as a proxy for finding LinkedIn content
    const params = new URLSearchParams({
      keyword,
      page_size: "10",
    });
    if (country && country !== "all") {
      params.set("country", country);
    }

    const response = await fetch(
      `https://nubela.co/proxycurl/api/search/person?${params}`,
      {
        headers: { Authorization: `Bearer ${PROXYCURL_API_KEY}` },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Proxycurl error [${response.status}]: ${errText}`);
      // Retry once after 1s
      await new Promise((r) => setTimeout(r, 1000));
      const retry = await fetch(
        `https://nubela.co/proxycurl/api/search/person?${params}`,
        { headers: { Authorization: `Bearer ${PROXYCURL_API_KEY}` } }
      );
      if (!retry.ok) {
        throw new Error(`Proxycurl failed after retry: ${retry.status}`);
      }
      const retryData = await retry.json();
      return normalizeProxycurlResults(retryData, keyword);
    }

    const data = await response.json();
    return normalizeProxycurlResults(data, keyword);
  } catch (error) {
    console.error("fetchLinkedInArticles error:", error);
    return generateSampleArticles(keyword, country);
  }
}

function normalizeProxycurlResults(data: any, keyword: string): Article[] {
  const results = data.results || [];
  return results.slice(0, 10).map((r: any) => ({
    title: r.headline || r.summary || `${keyword} — LinkedIn Profile`,
    snippet:
      r.summary ||
      r.headline ||
      `Professional content related to ${keyword}`,
    author: `${r.first_name || ""} ${r.last_name || ""}`.trim() || "LinkedIn User",
    url: r.linkedin_profile_url || r.url || "https://linkedin.com",
  }));
}

function generateSampleArticles(keyword: string, country: string): Article[] {
  const region = country && country !== "all" ? ` (${country.toUpperCase()})` : "";
  const topics = [
    { title: `How ${keyword} Is Reshaping Modern Industries${region}`, author: "Sarah Chen" },
    { title: `The Future of ${keyword}: Trends to Watch in 2026${region}`, author: "Marcus Johnson" },
    { title: `Why Every Leader Needs to Understand ${keyword}${region}`, author: "Priya Patel" },
    { title: `${keyword} Best Practices from Top Performers${region}`, author: "Alex Rivera" },
    { title: `Building a Career in ${keyword}: A Complete Guide${region}`, author: "Elena Kowalski" },
    { title: `${keyword} in Enterprise: Lessons Learned${region}`, author: "David Kim" },
    { title: `The ${keyword} Playbook for Startups${region}`, author: "Fatima Al-Rashid" },
    { title: `Data-Driven ${keyword} Strategies That Work${region}`, author: "James O'Brien" },
    { title: `${keyword} and Ethics: What We Need to Discuss${region}`, author: "Amara Okafor" },
    { title: `Scaling ${keyword} Operations Efficiently${region}`, author: "Liam Nguyen" },
  ];
  return topics.map((t, i) => ({
    title: t.title,
    snippet: `In-depth exploration of ${keyword.toLowerCase()} covering current trends, practical insights, and actionable strategies for professionals.`,
    author: t.author,
    url: `https://www.linkedin.com/pulse/${keyword.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
  }));
}

/**
 * Use Lovable AI to filter the most relevant articles and generate summaries.
 */
async function aiFilterAndSummarize(
  articles: Article[],
  keyword: string
): Promise<Article[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not set — returning unfiltered articles");
    return articles.slice(0, 5);
  }

  const prompt = `You are an expert content curator. Given a list of LinkedIn articles related to "${keyword}", select the top 5 most relevant and valuable articles. For each selected article, write a concise 2-3 sentence summary.

Articles:
${articles.map((a, i) => `${i + 1}. Title: ${a.title}\n   Snippet: ${a.snippet}\n   Author: ${a.author}\n   URL: ${a.url}`).join("\n\n")}

Return your response using the suggest_articles tool.`;

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are an expert LinkedIn content curator. Always use the provided tool to return structured results.",
            },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_articles",
                description: "Return the top 5 most relevant articles with summaries",
                parameters: {
                  type: "object",
                  properties: {
                    articles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          summary: { type: "string" },
                          author: { type: "string" },
                          url: { type: "string" },
                        },
                        required: ["title", "summary", "author", "url"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["articles"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "suggest_articles" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("AI rate limited, returning unfiltered results");
        return articles.slice(0, 5).map((a) => ({
          ...a,
          snippet: a.snippet,
        }));
      }
      if (response.status === 402) {
        console.warn("AI payment required, returning unfiltered results");
        return articles.slice(0, 5);
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.articles || articles.slice(0, 5);
    }

    return articles.slice(0, 5);
  } catch (error) {
    console.error("AI summarization error:", error);
    return articles.slice(0, 5);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get("keyword")?.trim();
    const country = url.searchParams.get("country") || "all";
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Missing 'keyword' query parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    const cacheKey = `${keyword}:${country}:${page}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ results: cached, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch articles
    const rawArticles = await fetchLinkedInArticles(keyword, country);

    // AI filter & summarize
    const results = await aiFilterAndSummarize(rawArticles, keyword);

    // Cache results
    setCache(cacheKey, results);

    return new Response(
      JSON.stringify({ results, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-articles error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
