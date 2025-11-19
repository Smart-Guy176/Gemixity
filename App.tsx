import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { SourceCard } from './components/SourceCard';
import { SearchResultItem } from './components/SearchResultItem';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { LoadingState } from './components/LoadingState';
import { HistorySidebar } from './components/HistorySidebar';
import { searchWithGemini } from './services/geminiService';
import { Message, ChatSession } from './types';
import { SUGGESTED_QUESTIONS } from './constants';
import { Send, ArrowRight, Plus, Library, AlignLeft, BrainCircuit, Menu, Search, Zap, BookOpen, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'gemini_deep_search_history';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [isSearchOnly, setIsSearchOnly] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSources, setExpandedSources] = useState<string[]>([]); // Track expanded sources per message ID
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save history when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewSession = (initialQuery: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: initialQuery,
      timestamp: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const updateCurrentSession = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return { ...session, messages: newMessages };
      }
      return session;
    }));
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setQuery('');
    if (isMobile) setIsSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  const toggleSourceExpansion = (msgId: string) => {
    setExpandedSources(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const searchQuery = overrideQuery || query;
    if (!searchQuery.trim() || isLoading) return;

    let activeSessionId = currentSessionId;
    let currentMessages = messages;

    // If starting a new chat
    if (!activeSessionId) {
      activeSessionId = createNewSession(searchQuery);
      currentMessages = [];
    }

    const newMessageId = Date.now().toString();
    const userMsg: Message = {
      id: newMessageId,
      role: 'user',
      content: searchQuery,
    };

    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    updateCurrentSession(updatedMessages);
    setQuery('');
    setIsLoading(true);

    try {
      const { text, sources, relatedQuestions, searchResults } = await searchWithGemini(searchQuery, isDeepResearch, isSearchOnly);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        sources: sources,
        searchResults: searchResults,
        relatedQueries: relatedQuestions,
        isSearchOnly: isSearchOnly
      };
      
      const finalMessages = [...updatedMessages, modelMsg];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error while performing research. Please try again.",
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-200 font-sans selection:bg-teal-500/30 flex overflow-hidden">
      
      {/* Mobile Menu Toggle - Floating */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-[#1e293b]/80 backdrop-blur rounded-lg border border-gray-700 md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out shrink-0 md:relative fixed inset-y-0 z-40`}>
         <HistorySidebar 
           sessions={sessions}
           currentSessionId={currentSessionId}
           onSelectSession={handleSelectSession}
           onNewChat={handleNewChat}
           onDeleteSession={handleDeleteSession}
           isOpen={true} // controlled by parent width
         />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative w-full">
        <Header />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className={`w-full max-w-3xl mx-auto px-4 flex flex-col transition-all duration-500 min-h-full ${messages.length > 0 ? 'pt-24 pb-40' : 'justify-center items-center pb-20'}`}>
            
            {/* Initial State */}
            {messages.length === 0 && (
              <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 mt-auto mb-auto">
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 mb-8 ring-1 ring-teal-500/20">
                  <Search className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-serif font-medium mb-4 text-white tracking-tight">
                  Where knowledge begins
                </h2>
                <p className="text-gray-400 mb-8 text-lg">Ask anything. Deep research included.</p>
                
                <div className="w-full relative group z-20">
                  <form onSubmit={(e) => handleSubmit(e)} className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                       <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={isDeepResearch ? "Ask a complex question..." : "Ask anything..."}
                      className="w-full bg-[#1e293b] text-white pl-12 pr-40 py-4 rounded-xl border border-gray-700 shadow-2xl focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-lg placeholder-gray-500 outline-none"
                      autoFocus
                    />
                    
                    {/* Toggles inside Input */}
                    <div className="absolute inset-y-2 right-14 flex items-center gap-2">
                        
                       {/* Search Only Toggle */}
                       <button
                        type="button"
                        onClick={() => setIsSearchOnly(!isSearchOnly)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                          isSearchOnly 
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                            : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
                        }`}
                        title={isSearchOnly ? "Search Only Mode" : "Enable Search Only"}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Search</span>
                      </button>

                      {/* Deep Search Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsDeepResearch(!isDeepResearch)}
                        disabled={isSearchOnly}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border ${
                          isSearchOnly ? 'opacity-30 cursor-not-allowed' :
                          isDeepResearch 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                            : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
                        }`}
                        title={isDeepResearch ? "Deep Research Active" : "Enable Deep Research"}
                      >
                        {isDeepResearch ? <BookOpen className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isDeepResearch ? "Pro" : "Fast"}</span>
                      </button>
                    </div>

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
            {messages.length > 0 && (
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
                        
                        {/* SEARCH ONLY MODE VIEW */}
                        {msg.isSearchOnly && (
                          <div className="w-full space-y-4">
                              <div className="flex items-center gap-2 mb-2 text-white font-medium">
                                <Globe className="w-5 h-5" />
                                Search Results
                              </div>
                              {msg.searchResults && msg.searchResults.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {msg.searchResults.map((result, i) => (
                                        <SearchResultItem key={i} result={result} />
                                    ))}
                                </div>
                              ) : (
                                <div className="p-4 border border-gray-800 rounded-lg bg-[#1e293b]/30 text-gray-300 whitespace-pre-wrap font-mono text-sm">
                                    {msg.content || "No results returned."}
                                </div>
                              )}
                          </div>
                        )}

                        {/* STANDARD ANSWER MODE VIEW */}
                        {!msg.isSearchOnly && (
                            <>
                                {/* Sources Section */}
                                {msg.sources && msg.sources.length > 0 && (
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-4 text-white font-medium">
                                      <div className="flex items-center gap-2">
                                          <Library className="w-5 h-5" />
                                          Sources
                                      </div>
                                      {msg.sources.length > 4 && (
                                          <button 
                                            onClick={() => toggleSourceExpansion(msg.id)}
                                            className="text-xs text-gray-400 hover:text-teal-400 flex items-center gap-1 transition-colors"
                                          >
                                              {expandedSources.includes(msg.id) ? (
                                                  <>Collapse <ChevronUp className="w-3 h-3"/></>
                                              ) : (
                                                  <>View {msg.sources.length - 4} more <ChevronDown className="w-3 h-3"/></>
                                              )}
                                          </button>
                                      )}
                                    </div>
                                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${expandedSources.includes(msg.id) ? '' : ''}`}>
                                    {(expandedSources.includes(msg.id) ? msg.sources : msg.sources.slice(0, 4)).map((source, idx) => (
                                        <SourceCard key={idx} source={source} index={idx} />
                                    ))}
                                    </div>
                                </div>
                                )}

                                {/* Reasoning Indicator */}
                                {isDeepResearch && (
                                <div className="flex items-center gap-2 text-sm text-teal-400 font-mono bg-teal-950/30 w-fit px-3 py-1 rounded-full border border-teal-900/50">
                                    <BrainCircuit className="w-4 h-4" />
                                    <span>Deep Research Analyzed</span>
                                </div>
                                )}

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
                            </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && <LoadingState />}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>
        </main>

        {/* Sticky Search Bar for Chat Mode */}
        {messages.length > 0 && (
          <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-[#0f1117]/90 backdrop-blur-xl border-t border-gray-800 p-4 z-30 transition-all duration-300">
            <div className="max-w-3xl mx-auto">
              <form 
                onSubmit={(e) => handleSubmit(e)}
                className="relative flex items-center gap-2 p-3 rounded-full bg-[#1e293b] border border-gray-700 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all shadow-2xl"
              >
                
                 {/* Search Only Toggle Footer */}
                 <button
                    type="button"
                    onClick={() => setIsSearchOnly(!isSearchOnly)}
                    className={`flex items-center gap-1.5 px-2 py-1 ml-1 rounded-md text-xs font-medium transition-all border shrink-0 ${
                      isSearchOnly 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' 
                        : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>

                 {/* Deep Search Toggle Footer */}
                 <button
                    type="button"
                    onClick={() => setIsDeepResearch(!isDeepResearch)}
                    disabled={isSearchOnly}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border shrink-0 ${
                      isSearchOnly ? 'opacity-30 cursor-not-allowed' :
                      isDeepResearch 
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                        : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700'
                    }`}
                  >
                    {isDeepResearch ? <BookOpen className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isDeepResearch ? "Pro" : "Fast"}</span>
                  </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask follow-up..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 text-base min-w-0"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="p-2 rounded-full bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;