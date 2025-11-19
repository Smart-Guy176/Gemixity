import React, { useEffect, useState } from 'react';
import { Loader2, Globe, Brain, FileText, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { icon: Brain, text: "Analyzing query & intent..." },
  { icon: Globe, text: "Searching web sources..." },
  { icon: FileText, text: "Reading content..." },
  { icon: Brain, text: "Synthesizing & Reasoning..." },
];

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length ? prev + 1 : prev));
    }, 1200); // Slightly faster progression
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl py-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-teal-400 mb-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-medium font-mono text-sm tracking-wide">DEEP SEARCH IN PROGRESS</span>
      </div>
      
      <div className="space-y-3 pl-1">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-4 transition-all duration-500 ${
                isActive ? 'text-gray-200 scale-100' : 
                isCompleted ? 'text-teal-500/60' : 'text-gray-700'
              }`}
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isActive ? (
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
                )}
              </div>
              
              <div className={`flex items-center gap-3 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : ''}`} />
                <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{step.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};