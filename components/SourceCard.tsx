import React from 'react';
import { Globe } from 'lucide-react';
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

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-40 md:w-48 bg-[#1e293b] hover:bg-[#2d3b52] transition-colors rounded-lg p-3 flex flex-col gap-2 border border-gray-700/50 group no-underline"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400 truncate w-full pr-2">Source {index + 1}</div>
      </div>
      <h3 className="text-sm font-medium text-gray-200 leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
        {source.title}
      </h3>
      <div className="mt-auto pt-2 flex items-center gap-2">
        <img 
          src={getFavicon(source.uri)} 
          alt="" 
          className="w-4 h-4 rounded-full bg-white/10"
          onError={(e) => { (e.target as HTMLImageElement).src = 'about:blank'; (e.target as HTMLImageElement).style.display='none'; }} 
        />
        <div className="text-xs text-gray-500 truncate font-mono">
          {tryGetHostname(source.uri)}
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