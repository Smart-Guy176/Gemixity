import React, { useEffect, useState } from 'react';
import { Loader2, Search, BookOpen, PenTool } from 'lucide-react';

const STEPS = [
  { icon: Search, text: "Identifying key concepts..." },
  { icon: Search, text: "Searching the web..." },
  { icon: BookOpen, text: "Reading 10+ sources..." },
  { icon: PenTool, text: "Synthesizing answer..." },
];

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-blue-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-medium text-lg">Researching</span>
      </div>
      <div className="flex flex-col gap-2 pl-9 border-l-2 border-gray-800">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isPast = idx < currentStep;
          
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-3 transition-all duration-500 ${
                isActive ? 'text-blue-300 opacity-100 translate-x-1' : 
                isPast ? 'text-gray-500 opacity-60' : 'text-gray-700 opacity-40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{step.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};