export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
  isThinking?: boolean;
  relatedQueries?: string[];
}

export interface SearchState {
  query: string;
  isLoading: boolean;
  error: string | null;
}