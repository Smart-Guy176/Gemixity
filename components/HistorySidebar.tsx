import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, Trash2, History } from 'lucide-react';

interface HistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  isOpen: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-[#0f1117] border-r border-gray-800 transform transition-transform duration-300 z-40 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between mt-16 md:mt-0">
        <button 
          onClick={onNewChat}
          className="flex items-center gap-2 w-full bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 flex flex-col items-center gap-2">
            <History className="w-8 h-8 opacity-50" />
            <span className="text-xs">No history yet</span>
          </div>
        ) : (
          sessions.sort((a, b) => b.timestamp - a.timestamp).map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id 
                  ? 'bg-[#1e293b] text-teal-400' 
                  : 'text-gray-400 hover:bg-[#1e293b]/50 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="flex-1 truncate text-sm">
                {session.title}
              </div>
              <button
                onClick={(e) => onDeleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 hover:text-red-400 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-gray-800 text-xs text-gray-600 text-center">
        Gemini Deep Search v2.0
      </div>
    </div>
  );
};