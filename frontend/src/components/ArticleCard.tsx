import { ExternalLink, User, Linkedin, Twitter } from "lucide-react";
import type { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
  index: number;
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  const isLinkedIn = article.platform === "linkedin";
  const platformColor = isLinkedIn 
    ? "hover:shadow-[0_0_20px_rgba(0,119,181,0.3)]" 
    : "hover:shadow-[0_0_20px_rgba(29,155,240,0.3)]";
  const platformBg = isLinkedIn 
    ? "bg-blue-900/10 border-blue-500/20" 
    : "bg-sky-900/10 border-sky-500/20";
  const platformAccent = isLinkedIn
    ? "text-blue-400"
    : "text-sky-400";
  
  return (
    <article
      className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${platformBg} ${platformColor}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className={`font-display text-lg font-semibold leading-snug group-hover:${platformAccent} transition-colors line-clamp-2 text-slate-100`}>
          {article.title}
        </h3>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 p-2 rounded-lg ${isLinkedIn ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-sky-900/20 text-sky-400 hover:bg-sky-900/40'} transition-colors`}
          aria-label={`Open on ${isLinkedIn ? 'LinkedIn' : 'Twitter'}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed mb-5 line-clamp-3">
        {article.summary}
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isLinkedIn ? 'bg-blue-900/30 text-blue-300' : 'bg-sky-900/30 text-sky-300'} font-medium`}>
            <User className="h-3.5 w-3.5" />
            {article.author}
          </span>
        </div>
        
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            isLinkedIn 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-sky-500 hover:bg-sky-400 text-white'
          }`}
        >
          {isLinkedIn ? (
            <>
              <Linkedin className="h-4 w-4" />
              View on LinkedIn
            </>
          ) : (
            <>
              <Twitter className="h-4 w-4" />
              View on Twitter/X
            </>
          )}
        </a>
      </div>
    </article>
  );
}
