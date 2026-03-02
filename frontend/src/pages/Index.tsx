import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ArticleList } from "@/components/ArticleList";
import { KeywordHistory } from "@/components/KeywordHistory";
import { useArticleSearch } from "@/hooks/useArticleSearch";
import { Download, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { 
    articles, 
    isLoading, 
    error, 
    keywordHistory, 
    search, 
    statusMessage, 
    clearHistory 
  } = useArticleSearch();

  const [hasSearched, setHasSearched] = useState(false);
  const [activeCountry, setActiveCountry] = useState("all");

  const handleReturnToHome = () => {
    setHasSearched(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (keyword: string, country: string) => {
    setHasSearched(true);
    setActiveCountry(country);
    search(keyword, country);
  };

  const handleHistorySelect = (keyword: string) => {
    setHasSearched(true);
    search(keyword, activeCountry);
  };

  const handleExportCSV = () => {
    if (articles.length === 0) return;
    const headers = ["Title", "Author", "URL", "Summary"];
    const csvRows = articles.map(a => [
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.author.replace(/"/g, '""')}"`,
      `"${a.url}"`,
      `"${a.summary.replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `nexus_research_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    /* THE FIX: This inline style blocks Tailwind from covering your image.
       The linear-gradient acts as the dark overlay for text legibility.
    */
    <div 
      className="min-h-screen w-full"
      style={{
        backgroundColor: '#020617',
        backgroundImage: 'linear-gradient(rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.8)), url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className={`relative transition-all duration-700 ${hasSearched ? 'py-8' : 'py-20 sm:py-32'}`}>
        <div className="relative container max-w-5xl text-center">
          <Link 
            to="/" 
            onClick={handleReturnToHome}
            className="inline-flex flex-col items-center group transition-all hover:scale-105 active:scale-95"
          >
            {!hasSearched && (
              <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.2)] mb-8">
                <Cpu className="h-10 w-10 text-blue-400 animate-pulse" />
              </div>
            )}
            <h1 className={`font-display font-bold tracking-tighter text-white transition-all duration-700 ${hasSearched ? 'text-4xl' : 'text-6xl sm:text-8xl'}`}>
              Nexus <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">Research</span>
            </h1>
            {!hasSearched && (
              <p className="max-w-xl mx-auto text-slate-400 text-lg md:text-xl mt-6">
                Professional Global Intelligence Engine
              </p>
            )}
          </Link>
        </div>
      </header>

      <main className={`container max-w-5xl transition-all duration-700 ${hasSearched ? 'py-2' : 'py-10'} space-y-12 pb-32`}>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <KeywordHistory
            history={keywordHistory}
            onSelect={handleHistorySelect}
            onClear={clearHistory}
          />
          {articles.length > 0 && !isLoading && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all font-bold shadow-lg"
            >
              <Download className="h-4 w-4" />
              Export Dataset
            </button>
          )}
        </div>

        <ArticleList
          articles={articles}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          statusMessage={statusMessage}
        />
      </main>
    </div>
  );
};

export default Index;