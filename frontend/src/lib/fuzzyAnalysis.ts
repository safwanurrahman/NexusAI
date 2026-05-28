import type { Article } from "@/types/article";

type WeightedTerms = Record<string, number>;

export interface FuzzyScore {
  key: string;
  label: string;
  score: number;
}

export interface FuzzyAnalysis {
  sentiments: FuzzyScore[];
  concepts: FuzzyScore[];
  dominantSentiments: FuzzyScore[];
  dominantConcepts: FuzzyScore[];
  analyzedItems: number;
}

const SENTIMENT_TERMS: Record<string, { label: string; terms: WeightedTerms }> = {
  optimism: {
    label: "Optimism",
    terms: {
      growth: 1.1,
      opportunity: 1.2,
      promising: 1.3,
      improve: 0.8,
      success: 1.1,
      positive: 1,
      momentum: 1,
      benefit: 0.9,
      progress: 1,
      potential: 0.8,
    },
  },
  confidence: {
    label: "Confidence",
    terms: {
      proven: 1.2,
      strong: 1,
      stable: 1,
      reliable: 1.2,
      leadership: 0.8,
      traction: 1,
      mature: 0.9,
      resilient: 1.1,
      efficient: 0.8,
    },
  },
  excitement: {
    label: "Excitement",
    terms: {
      launch: 0.9,
      breakthrough: 1.4,
      innovative: 1.2,
      exciting: 1.4,
      new: 0.5,
      emerging: 0.8,
      trend: 0.7,
      viral: 1,
      accelerate: 1,
    },
  },
  trust: {
    label: "Trust",
    terms: {
      trust: 1.4,
      transparent: 1.2,
      ethical: 1.2,
      secure: 1,
      compliance: 0.9,
      verified: 1.2,
      accountable: 1.1,
      responsible: 1,
    },
  },
  urgency: {
    label: "Urgency",
    terms: {
      urgent: 1.4,
      immediate: 1.2,
      now: 0.7,
      rapid: 1,
      pressure: 1.1,
      critical: 1.2,
      deadline: 1,
      shortage: 1,
      demand: 0.8,
    },
  },
  concern: {
    label: "Concern",
    terms: {
      concern: 1.4,
      challenge: 1,
      issue: 1,
      problem: 1.1,
      threat: 1.2,
      weakness: 1,
      decline: 1.1,
      barrier: 0.9,
      disruption: 0.9,
    },
  },
  risk: {
    label: "Risk",
    terms: {
      risk: 1.5,
      risky: 1.4,
      danger: 1.3,
      fraud: 1.3,
      breach: 1.2,
      loss: 1,
      volatile: 1.2,
      uncertainty: 0.9,
      liability: 1.2,
    },
  },
  skepticism: {
    label: "Skepticism",
    terms: {
      doubt: 1.3,
      skeptical: 1.5,
      questionable: 1.2,
      unclear: 1,
      hype: 1,
      overstate: 1.1,
      criticism: 1.1,
      concern: 0.7,
      limitation: 0.9,
    },
  },
  uncertainty: {
    label: "Uncertainty",
    terms: {
      uncertain: 1.5,
      maybe: 0.8,
      possible: 0.7,
      unknown: 1.2,
      unclear: 1.1,
      depends: 0.8,
      volatile: 1,
      unpredictable: 1.3,
    },
  },
  neutral: {
    label: "Neutral",
    terms: {
      report: 0.7,
      update: 0.7,
      overview: 0.8,
      announcement: 0.7,
      article: 0.5,
      discussion: 0.5,
      information: 0.6,
      research: 0.5,
    },
  },
};

const CONCEPT_TERMS: Record<string, { label: string; terms: WeightedTerms }> = {
  artificialIntelligence: {
    label: "AI",
    terms: { ai: 1.4, artificial: 1, intelligence: 0.9, llm: 1.4, gpt: 1.2, model: 0.7, automation: 1 },
  },
  technology: {
    label: "Technology",
    terms: { software: 1, platform: 0.9, cloud: 1, digital: 0.9, app: 0.8, system: 0.6, engineering: 1 },
  },
  data: {
    label: "Data",
    terms: { data: 1.4, analytics: 1.2, insight: 0.9, metric: 1, dashboard: 1, database: 1, pipeline: 1 },
  },
  security: {
    label: "Security",
    terms: { security: 1.4, privacy: 1.2, cyber: 1.3, breach: 1.2, encryption: 1.1, compliance: 0.9, risk: 0.7 },
  },
  marketDemand: {
    label: "Market Demand",
    terms: { market: 1.1, demand: 1.2, customer: 0.9, adoption: 1.1, trend: 0.8, consumer: 0.9, sales: 0.8 },
  },
  businessGrowth: {
    label: "Growth",
    terms: { growth: 1.4, revenue: 1.1, scale: 1, expansion: 1.2, profit: 1.1, traction: 1, funding: 0.9 },
  },
  finance: {
    label: "Finance",
    terms: { finance: 1.3, investment: 1.2, funding: 1.2, revenue: 1, cost: 0.8, budget: 0.9, valuation: 1.2 },
  },
  hiringTalent: {
    label: "Talent",
    terms: { hiring: 1.4, talent: 1.3, job: 1, workforce: 1.1, employee: 0.9, skill: 1, recruitment: 1.2 },
  },
  leadership: {
    label: "Leadership",
    terms: { leadership: 1.4, founder: 1, ceo: 1, manager: 0.8, executive: 1, strategy: 0.9, vision: 0.9 },
  },
  operations: {
    label: "Operations",
    terms: { operations: 1.3, process: 1, workflow: 1, productivity: 1, efficiency: 1.1, supply: 0.8, logistics: 1.1 },
  },
  product: {
    label: "Product",
    terms: { product: 1.4, feature: 1, launch: 1, roadmap: 1, user: 0.8, design: 0.9, experience: 0.8 },
  },
  customerExperience: {
    label: "Customer",
    terms: { customer: 1.4, client: 1, user: 1, audience: 0.8, service: 0.8, satisfaction: 1.1, support: 0.9 },
  },
  regulation: {
    label: "Regulation",
    terms: { regulation: 1.4, policy: 1.1, law: 1, compliance: 1.2, governance: 1.2, legal: 1, standard: 0.7 },
  },
  sustainability: {
    label: "Sustainability",
    terms: { sustainability: 1.4, climate: 1.2, energy: 1, green: 1, carbon: 1.1, environment: 1.1, renewable: 1.2 },
  },
  healthcare: {
    label: "Healthcare",
    terms: { health: 1.1, healthcare: 1.4, medical: 1.2, patient: 1.1, hospital: 1.1, clinical: 1.1, pharma: 1 },
  },
  education: {
    label: "Education",
    terms: { education: 1.4, learning: 1.1, student: 1.1, training: 1, course: 0.9, school: 1, university: 1 },
  },
  partnerships: {
    label: "Partnerships",
    terms: { partnership: 1.4, collaboration: 1.2, alliance: 1.1, ecosystem: 1, community: 0.9, network: 0.8 },
  },
  competition: {
    label: "Competition",
    terms: { competition: 1.4, competitor: 1.3, rival: 1.2, marketshare: 1.1, differentiation: 1, advantage: 0.8 },
  },
  culture: {
    label: "Culture",
    terms: { culture: 1.4, team: 0.9, workplace: 1.1, inclusion: 1, diversity: 1, values: 0.9, community: 0.8 },
  },
  infrastructure: {
    label: "Infrastructure",
    terms: { infrastructure: 1.4, network: 0.9, transport: 1, energy: 0.9, cloud: 0.8, deployment: 0.8, facility: 0.9 },
  },
};

const INTENSIFIERS: WeightedTerms = {
  very: 1.2,
  highly: 1.2,
  major: 1.2,
  significant: 1.2,
  massive: 1.3,
  critical: 1.2,
  rapidly: 1.15,
};

function countTerm(text: string, term: string): number {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(`\\b${escapedTerm}\\b`, "g"));
  return matches?.length ?? 0;
}

function intensityMultiplier(text: string): number {
  const boost = Object.entries(INTENSIFIERS).reduce((total, [term, weight]) => {
    return total + countTerm(text, term) * (weight - 1);
  }, 0);

  return Math.min(1.6, 1 + boost);
}

function scoreTaxonomy(text: string, taxonomy: Record<string, { label: string; terms: WeightedTerms }>): FuzzyScore[] {
  const multiplier = intensityMultiplier(text);
  const rawScores = Object.entries(taxonomy).map(([key, item]) => {
    const rawScore = Object.entries(item.terms).reduce((total, [term, weight]) => {
      return total + countTerm(text, term) * weight * multiplier;
    }, 0);

    return { key, label: item.label, rawScore };
  });

  const maxScore = Math.max(...rawScores.map((item) => item.rawScore), 1);

  return rawScores.map(({ key, label, rawScore }) => ({
    key,
    label,
    score: Math.round(Math.min(100, (rawScore / maxScore) * 100)),
  }));
}

function articleCorpus(articles: Article[]): string {
  return articles
    .map((article) => `${article.title} ${article.summary} ${article.author}`)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ");
}

function topScores(scores: FuzzyScore[], count: number): FuzzyScore[] {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, count);
}

export function analyzeArticles(articles: Article[]): FuzzyAnalysis {
  const corpus = articleCorpus(articles);
  const sentiments = scoreTaxonomy(corpus, SENTIMENT_TERMS);
  const concepts = scoreTaxonomy(corpus, CONCEPT_TERMS);

  return {
    sentiments,
    concepts,
    dominantSentiments: topScores(sentiments, 4),
    dominantConcepts: topScores(concepts, 6),
    analyzedItems: articles.length,
  };
}
