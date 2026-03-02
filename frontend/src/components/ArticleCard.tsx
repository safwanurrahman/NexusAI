import { ExternalLink, User } from "lucide-react";
import type { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
  index: number;
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  return (
    <article
      className="group relative bg-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Open article"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-3">
        {article.summary}
      </p>

      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
          <User className="h-3.5 w-3.5" />
          {article.author}
        </span>
      </div>
    </article>
  );
}
