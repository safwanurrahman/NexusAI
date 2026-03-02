import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
      {/* FORCE THE BACKGROUND HERE */}
      <div 
        className="min-h-screen w-full flex flex-col relative"
        style={{ 
          backgroundColor: '#050a18', // Deep blue fallback
          backgroundImage: `url('https://img.freepik.com/free-vector/background-realistic-abstract-technology-particle_23-2148431705.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Semi-transparent Dark Tint Overlay - This makes white text readable */}
        <div className="flex-1 w-full bg-slate-950/60 backdrop-blur-[1px]">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;