export interface Source {
  title: string;
  uri: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
  searchResults?: SearchResult[];
  isThinking?: boolean;
  isSearchOnly?: boolean;
  relatedQueries?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

export interface SearchOptions {
  isDeepResearch: boolean;
  isSearchOnly: boolean;
}

export interface SearchState {
  query: string;
  isLoading: boolean;
  error: string | null;
}