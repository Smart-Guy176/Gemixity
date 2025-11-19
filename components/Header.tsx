import React from 'react';
import { Compass } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-[#0f1117]/80 backdrop-blur-md z-20 border-b border-gray-800 flex items-center px-4 md:px-8 md:ml-0 ml-10">
      <div className="flex items-center gap-3 select-none">
        <Compass className="w-6 h-6 text-teal-500" />
        <h1 className="text-lg font-bold text-white tracking-tight">DeepSearch</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
         <div className="text-xs font-mono text-gray-500 hidden sm:block">
            Powered by Gemini 2.5
         </div>
      </div>
    </header>
  );
};