import React from 'react';
import { Compass } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f1117]/80 backdrop-blur-md z-50 border-b border-gray-800 flex items-center px-4 md:px-8">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
        <Compass className="w-8 h-8 text-blue-500" />
        <h1 className="text-xl font-bold text-white tracking-tight">DeepSearch</h1>
      </div>
    </header>
  );
};