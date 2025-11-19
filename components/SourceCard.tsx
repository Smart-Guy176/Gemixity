import React from 'react';
import { Source } from '../types';

interface SourceCardProps {
  source: Source;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return '';
    }
  };

  const hostname = tryGetHostname(source.uri);

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col justify-between bg-[#1e293b]/40 hover:bg-[#1e293b] border border-gray-800 hover:border-gray-600 p-3 rounded-lg transition-all duration-200 h-24 group no-underline"
    >
      <div className="text-xs text-gray-300 line-clamp-2 font-medium group-hover:text-teal-300 transition-colors">
        {source.title}
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <img 
          src={getFavicon(source.uri)} 
          alt="" 
          className="w-4 h-4 rounded-full bg-white/10"
          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} 
        />
        <div className="text-[10px] text-gray-500 truncate font-mono max-w-full">
          {hostname}
        </div>
        <div className="ml-auto text-[10px] text-gray-600 font-bold bg-gray-800/50 px-1.5 rounded">
          {index + 1}
        </div>
      </div>
    </a>
  );
};

function tryGetHostname(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'web';
  }
}