import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { SourceCard } from './components/SourceCard';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { LoadingState } from './components/LoadingState';
import { searchWithGemini } from './services/geminiService';
import { Message, Source } from './types';
import { SUGGESTED_QUESTIONS } from './constants';
import { Send, ArrowRight, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim() || isLoading) return;

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
      const { text, sources } = await searchWithGemini(searchQuery);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        sources: sources
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error while searching. Please check your API key or try again later.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      // Focus back on input for follow-up
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col font-sans selection:bg-blue-500/30">
      <Header />
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-24 pb-32 flex flex-col">
        
        {/* Empty State / Suggestions */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
              Where knowledge begins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, q)}
                  className="text-left p-4 rounded-xl bg-[#1e293b]/50 hover:bg-[#1e293b] border border-gray-800 hover:border-gray-600 transition-all duration-200 group"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white">{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex flex-col gap-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-4 animate-in fade-in duration-500 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* User Message */}
              {msg.role === 'user' && (
                <div className="text-2xl md:text-3xl font-semibold text-white py-4">
                  {msg.content}
                </div>
              )}

              {/* Model Message */}
              {msg.role === 'model' && (
                <div className="w-full flex flex-col gap-6">
                  
                  {/* Sources Section */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-3 text-gray-400 uppercase text-xs font-bold tracking-wider">
                        <Plus className="w-3 h-3" />
                        Sources
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {msg.sources.map((source, idx) => (
                          <SourceCard key={idx} source={source} index={idx} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answer Section */}
                  <div className="w-full">
                     <div className="flex items-center gap-2 mb-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
                        <ArrowRight className="w-3 h-3" />
                        Answer
                      </div>
                      <MarkdownRenderer content={msg.content} />
                  </div>
                  
                  <div className="h-px w-full bg-gray-800 my-2" />
                </div>
              )}
            </div>
          ))}

          {isLoading && <LoadingState />}
          <div ref={messagesEndRef} />
        </div>

      </main>

      {/* Sticky Input Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0f1117]/80 backdrop-blur-lg border-t border-gray-800 p-4 z-40">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={(e) => handleSubmit(e)}
            className="relative flex items-center gap-2 p-2 rounded-full bg-[#1e293b] border border-gray-700 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-2xl"
          >
            <div className="pl-4">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 h-10 text-base"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!query.trim() || isLoading}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-600">Powered by Gemini 2.5 Flash & Google Search</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;