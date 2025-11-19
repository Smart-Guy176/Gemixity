import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { SourceCard } from './components/SourceCard';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { LoadingState } from './components/LoadingState';
import { searchWithGemini } from './services/geminiService';
import { Message, Source } from './types';
import { SUGGESTED_QUESTIONS } from './constants';
import { Send, ArrowRight, Plus, Library, AlignLeft, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Only scroll if we are in chat mode
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim() || isLoading) return;

    setHasSearched(true);
    const newMessageId = Date.now().toString();
    
    // Add user message
    const userMsg: Message = {
      id: newMessageId,
      role: 'user',
      content: searchQuery,
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const { text, sources, relatedQuestions } = await searchWithGemini(searchQuery);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        sources: sources,
        relatedQueries: relatedQuestions
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error while performing deep research. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-200 flex flex-col font-sans selection:bg-teal-500/30">
      <Header />
      
      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col transition-all duration-500 ${hasSearched ? 'pt-24 pb-40' : 'justify-center items-center pb-20'}`}>
        
        {/* Initial State */}
        {!hasSearched && (
          <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-8 text-white tracking-tight">
              What do you want to know?
            </h2>
            
            <div className="w-full relative group z-20">
              <form onSubmit={(e) => handleSubmit(e)} className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-[#1e293b] text-white pl-12 pr-12 py-4 rounded-xl border border-gray-700 shadow-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-lg placeholder-gray-500 outline-none"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!query.trim()}
                  className="absolute inset-y-2 right-2 bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-lg transition-colors disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm text-gray-400">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, q)}
                  className="px-4 py-2 bg-[#1e293b]/50 hover:bg-[#2d3b52] rounded-full border border-gray-800 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {hasSearched && (
          <div className="flex flex-col gap-10 w-full">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex flex-col gap-4 animate-in fade-in duration-500 ${msg.role === 'user' ? 'border-b border-gray-800 pb-8' : ''}`}>
                
                {/* User Query Display */}
                {msg.role === 'user' && (
                  <div className="text-3xl font-serif text-white py-2">
                    {msg.content}
                  </div>
                )}

                {/* Model Response */}
                {msg.role === 'model' && (
                  <div className="w-full flex flex-col gap-8">
                    
                    {/* Sources Section */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-4 text-white font-medium">
                          <Library className="w-5 h-5" />
                          Sources
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {msg.sources.slice(0, 4).map((source, idx) => (
                            <SourceCard key={idx} source={source} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasoning Indicator (Visual Only since API handles it internally mostly) */}
                    <div className="flex items-center gap-2 text-sm text-teal-400 font-mono bg-teal-950/30 w-fit px-3 py-1 rounded-full border border-teal-900/50">
                      <BrainCircuit className="w-4 h-4" />
                      <span>Deep Reasoning Complete</span>
                    </div>

                    {/* Answer Section */}
                    <div className="w-full">
                       <div className="flex items-center gap-2 mb-4 text-white font-medium">
                          <AlignLeft className="w-5 h-5" />
                          Answer
                        </div>
                        <div className="prose prose-invert prose-teal max-w-none">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                    </div>

                    {/* Related Questions */}
                    {msg.relatedQueries && msg.relatedQueries.length > 0 && (
                      <div className="pt-4 border-t border-gray-800/50">
                        <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Related</h4>
                        <div className="flex flex-col gap-2">
                          {msg.relatedQueries.map((q, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSubmit(undefined, q)}
                              className="flex items-center justify-between w-full p-3 text-left text-gray-300 hover:bg-[#1e293b] rounded-lg transition-colors group border border-transparent hover:border-gray-700"
                            >
                              <span>{q}</span>
                              <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && <LoadingState />}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      {/* Sticky Search Bar for Chat Mode */}
      {hasSearched && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[#0f1117]/90 backdrop-blur-xl border-t border-gray-800 p-4 z-40">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={(e) => handleSubmit(e)}
              className="relative flex items-center gap-2 p-3 rounded-full bg-[#1e293b] border border-gray-700 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all shadow-2xl"
            >
              <div className="pl-2">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask follow-up..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-base"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!query.trim() || isLoading}
                className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
};

// Helper icon
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

export default App;