import React from 'react';
import { SearchResult } from '../types';
import { ExternalLink } from 'lucide-react';

interface SearchResultItemProps {
  result: SearchResult;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ result }) => {
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return '';
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <a 
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 p-4 rounded-xl bg-[#1e293b]/30 hover:bg-[#1e293b]/60 border border-gray-800/50 hover:border-gray-700 transition-all group no-underline"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <img 
          src={getFavicon(result.url)} 
          alt="" 
          className="w-5 h-5 rounded-full bg-white/5"
          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} 
        />
        <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400 group-hover:text-gray-300">
                {getDomain(result.url)}
            </span>
            <h3 className="text-teal-400 font-medium text-base group-hover:underline decoration-teal-500/50 underline-offset-2">
                {result.title}
            </h3>
        </div>
      </div>
      
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 pl-1">
        {result.snippet}
      </p>
    </a>
  );
};