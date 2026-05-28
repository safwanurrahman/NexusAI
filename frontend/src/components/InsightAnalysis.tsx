import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BrainCircuit, Gauge } from "lucide-react";

import type { Article } from "@/types/article";
import { analyzeArticles, type FuzzyScore } from "@/lib/fuzzyAnalysis";

interface InsightAnalysisProps {
  articles: Article[];
}

function RadarPanel({
  title,
  icon,
  data,
  color,
}: {
  title: string;
  icon: ReactNode;
  data: FuzzyScore[];
  color: string;
}) {
  const chartData = data.map((item) => ({
    label: item.label,
    score: item.score,
  }));

  return (
    <section className="rounded-2xl border border-white/10 bg-card/80 p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid stroke="rgba(148, 163, 184, 0.22)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "rgb(203, 213, 225)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "rgb(148, 163, 184)", fontSize: 10 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value) => [`${value}%`, "Score"]}
            />
            <Radar
              dataKey="score"
              stroke={color}
              fill={color}
              fillOpacity={0.26}
              strokeWidth={2}
              dot={{ r: 2, fill: color }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ScorePills({ title, scores }: { title: string; scores: FuzzyScore[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {scores.map((score) => (
          <span
            key={score.key}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-muted/70 px-3 py-1.5 text-sm text-slate-200"
          >
            <span>{score.label}</span>
            <span className="font-mono text-xs text-primary">{score.score}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function InsightAnalysis({ articles }: InsightAnalysisProps) {
  const analysis = useMemo(() => analyzeArticles(articles), [articles]);

  if (articles.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Fuzzy Insight Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Local fuzzy scoring across {analysis.analyzedItems} extracted results
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RadarPanel
          title="Sentiment Spectrum"
          icon={<Gauge className="h-5 w-5" />}
          data={analysis.sentiments}
          color="rgb(56, 189, 248)"
        />
        <RadarPanel
          title="Concept Radar"
          icon={<BrainCircuit className="h-5 w-5" />}
          data={analysis.concepts}
          color="rgb(34, 197, 94)"
        />
      </div>

      <div className="grid gap-5 rounded-2xl border border-white/10 bg-card/80 p-5 md:grid-cols-2">
        <ScorePills title="Dominant sentiments" scores={analysis.dominantSentiments} />
        <ScorePills title="Dominant concepts" scores={analysis.dominantConcepts} />
      </div>
    </section>
  );
}
