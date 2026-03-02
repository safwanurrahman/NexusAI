import type { Article } from "@/types/article";
import { ArticleCard } from "./ArticleCard";
import { FileSearch, Sparkles } from "lucide-react";

interface ArticleListProps {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  statusMessage?: string; // New prop for progress updates
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-5 bg-muted rounded w-1/2" />
        </div>
        <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="h-7 bg-muted rounded-full w-32" />
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
              Analyzing LinkedIn signals and generating AI summaries
            </p>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
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
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Top {articles.length} insights — AI-curated & summarized
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
          <ArticleCard key={`${article.url}-${i}`} article={article} index={i} />
        ))}
      </div>
    </div>
  );
}