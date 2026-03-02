export interface Article {
  title: string;
  summary: string;
  author: string;
  url: string;
}

export interface SearchResponse {
  results: Article[];
  cached: boolean;
}

export interface SearchFilters {
  keyword: string;
  country: string;
}

export const COUNTRIES = [
  { value: "all", label: "Global 🌐" },
  { value: "bd", label: "Bangladesh 🇧🇩" },
  { value: "us", label: "United States 🇺🇸" },
  { value: "gb", label: "United Kingdom 🇬🇧" },
  { value: "ca", label: "Canada 🇨🇦" },
  { value: "au", label: "Australia 🇦🇺" },
  { value: "de", label: "Germany 🇩🇪" },
  { value: "fr", label: "France 🇫🇷" },
  { value: "in", label: "India 🇮🇳" },
  { value: "sg", label: "Singapore 🇸🇬" },
  { value: "ae", label: "UAE 🇦🇪" },
  { value: "nl", label: "Netherlands 🇳🇱" },
] as const;
