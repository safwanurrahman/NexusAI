import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeywordHistoryProps {
  history: string[];
  onSelect: (keyword: string) => void;
  onClear: () => void;
}

export function KeywordHistory({ history, onSelect, onClear }: KeywordHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Recent searches
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((kw) => (
          <button
            key={kw}
            onClick={() => onSelect(kw)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
}
