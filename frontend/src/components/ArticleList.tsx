import type { Article } from "@/types/article";
import { ArticleCard } from "./ArticleCard";
import { InsightAnalysis } from "./InsightAnalysis";
import { FileSearch, Sparkles, Linkedin, Twitter } from "lucide-react";

interface ArticleListProps {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  statusMessage?: string;
}

function SkeletonCard({ platform }: { platform: "linkedin" | "twitter" }) {
  const bgColor = platform === "linkedin" ? "bg-blue-900/10" : "bg-sky-900/10";
  const borderColor = platform === "linkedin" ? "border-blue-500/20" : "border-sky-500/20";
  
  return (
    <div className={`${bgColor} rounded-2xl border ${borderColor} p-6 animate-pulse`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-700 rounded w-3/4" />
          <div className="h-5 bg-slate-700 rounded w-1/2" />
        </div>
        <div className="h-8 w-8 bg-slate-700 rounded-lg shrink-0" />
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-slate-700 rounded w-2/3" />
      </div>
      <div className="space-y-2">
        <div className="h-7 bg-slate-700 rounded-full w-32" />
        <div className="h-10 bg-slate-700 rounded-lg w-full" />
      </div>
    </div>
  );
}
export function ArticleList({ 
  articles, 
  isLoading, 
  error, 
  hasSearched, 
  statusMessage 
}: ArticleListProps) {
  
  const linkedInArticles = articles.filter(a => a.platform === "linkedin");
  const twitterArticles = articles.filter(a => a.platform === "twitter");
  
  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Progress Feedback Section */}
        <div className="flex flex-col items-center justify-center p-8 bg-accent/5 rounded-3xl border border-accent/10">
          <div className="relative mb-4">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground animate-pulse">
              {statusMessage || "Researching..."}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Searching LinkedIn & Twitter/X in parallel and generating AI summaries
            </p>
          </div>
        </div>

        {/* Dual Skeleton Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-2">
              <Linkedin className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-slate-100">LinkedIn</h3>
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={`linkedin-skeleton-${i}`} platform="linkedin" />
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-2">
              <Twitter className="h-5 w-5 text-sky-400" />
              <h3 className="font-semibold text-slate-100">Twitter/X</h3>
              <span className="text-sm text-slate-400">Loading...</span>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={`twitter-skeleton-${i}`} platform="twitter" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mb-4">
          <FileSearch className="h-7 w-7" />
        </div>
        <p className="text-destructive font-medium mb-1">Something went wrong</p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  if (hasSearched && articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted text-muted-foreground mb-4">
          <FileSearch className="h-7 w-7" />
        </div>
        <p className="font-display font-semibold text-foreground mb-1">No articles found</p>
        <p className="text-muted-foreground text-sm">Try different keywords or broaden your search criteria.</p>
      </div>
    );
  }

  if (!hasSearched) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <InsightAnalysis articles={articles} />

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LinkedIn Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-900/20 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-slate-100">LinkedIn</h3>
            </div>
            <span className="text-sm font-medium text-blue-300 bg-blue-900/40 px-3 py-1 rounded-full">
              {linkedInArticles.length} results
            </span>
          </div>
          
          {linkedInArticles.length > 0 ? (
            <div className="space-y-4">
              {linkedInArticles.map((article, i) => (
                <ArticleCard 
                  key={`${article.url}-${i}`} 
                  article={article} 
                  index={i} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-blue-900/10 rounded-xl border border-blue-500/10">
              <p className="text-slate-400 text-sm">No LinkedIn results found</p>
            </div>
          )}
        </div>

        {/* Twitter Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 bg-sky-900/20 rounded-xl border border-sky-500/20">
            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5 text-sky-400" />
              <h3 className="font-semibold text-slate-100">Twitter/X</h3>
            </div>
            <span className="text-sm font-medium text-sky-300 bg-sky-900/40 px-3 py-1 rounded-full">
              {twitterArticles.length} results
            </span>
          </div>
          
          {twitterArticles.length > 0 ? (
            <div className="space-y-4">
              {twitterArticles.map((article, i) => (
                <ArticleCard 
                  key={`${article.url}-${i}`} 
                  article={article} 
                  index={i} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-sky-900/10 rounded-xl border border-sky-500/10">
              <p className="text-slate-400 text-sm">No Twitter results found</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground font-medium pt-4 border-t border-border">
        <p>Total {articles.length} insights — AI-curated & summarized</p>
      </div>
    </div>
  );
}
