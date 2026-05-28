import { useState } from "react";
import { Search, Loader2, XCircle } from "lucide-react"; // Added Loader2 for better UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/types/article";

interface SearchBarProps {
  onSearch: (keyword: string, country: string) => void;
  onStop: () => void; // 🛑 NEW: Prop to trigger the task revocation
  isLoading: boolean;
}

export function SearchBar({ onSearch, onStop, isLoading }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("all");

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isLoading) {
    onStop(); // This is the magic line that kills the search!
    return;
  }

  if (keyword.trim()) {
    onSearch(keyword.trim(), country);
  }
};

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto relative z-20">
  <div className="flex flex-col sm:flex-row gap-4 p-3 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
    
    {/* Search Input Field */}
    <div className="relative flex-1 group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400/70 group-focus-within:text-blue-400 transition-colors" />
      <Input
        type="text"
        placeholder="Search LinkedIn articles…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        // 🔒 Added: Disable input while searching to keep focus on the task
        disabled={isLoading}
        className="pl-12 h-14 text-lg rounded-xl border-none bg-slate-950/50 text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all disabled:opacity-50"
      />
    </div>

    {/* Region Selector */}
    <Select value={country} onValueChange={setCountry} disabled={isLoading}>
      <SelectTrigger className="h-14 w-full sm:w-52 rounded-xl border border-white/5 bg-slate-950/50 text-white text-base focus:ring-2 focus:ring-blue-500/50 transition-all">
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      
      <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white max-h-80 shadow-2xl z-[100]">
        {COUNTRIES.map((c) => (
          <SelectItem 
            key={c.value} 
            value={c.value} 
            className="hover:bg-blue-600 focus:bg-blue-600 focus:text-white cursor-pointer py-3"
          >
            <span className="flex items-center gap-3">
              {c.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* 🛑 UPDATED BUTTON LOGIC */}
    <Button
      type="submit"
      // CHANGE: Button is now CLICKABLE while isLoading is true
      disabled={!isLoading && !keyword.trim()} 
      className={`h-14 px-10 rounded-xl text-base font-bold transition-all active:scale-95 shadow-lg ${
        isLoading 
          ? "bg-slate-700 hover:bg-red-600 text-white shadow-red-500/10" // Red/Grey when searching
          : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20" // Blue when idle
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {/* ❌ Switched from Loader to XCircle to show it's a stop action */}
          <XCircle className="h-4 w-4" />
          Stop Research
        </span>
      ) : (
        "Initialize Research"
      )}
    </Button>
  </div>
</form>
  );
} 