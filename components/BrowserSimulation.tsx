import React, { useEffect, useState, useRef } from 'react';
import { AutomationTask, AutomationStep, AutomationStatus } from '../types';
import { Globe, Lock, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, MousePointer } from 'lucide-react';

interface BrowserSimulationProps {
  task?: AutomationTask;
  status: AutomationStatus;
  currentStepIndex: number;
  onStepComplete: () => void;
}

const BrowserSimulation: React.FC<BrowserSimulationProps> = ({ task, status, currentStepIndex, onStepComplete }) => {
  const [simulatedUrl, setSimulatedUrl] = useState("about:blank");
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  
  useEffect(() => {
    if (task && status === AutomationStatus.Running) {
      setSimulatedUrl(task.url);
      
      const step = task.steps[currentStepIndex];
      if (step) {
        // Simulate cursor movement randomly within the viewport to look like "AI"
        const targetX = Math.random() * 80 + 10;
        const targetY = Math.random() * 80 + 10;
        setCursorPos({ x: targetX, y: targetY });

        // Simulate action delay
        const timer = setTimeout(() => {
          onStepComplete();
        }, 2000); // 2 seconds per step

        return () => clearTimeout(timer);
      }
    }
  }, [task, status, currentStepIndex, onStepComplete]);

  if (!task && status === AutomationStatus.Idle) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
        <Globe size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Waiting for automation task...</p>
        <p className="text-sm">Ask the agent to apply for a document.</p>
      </div>
    );
  }

  const currentStep = task?.steps[currentStepIndex];

  return (
    <div className="flex flex-col h-full bg-slate-200 border-l border-slate-300 shadow-xl overflow-hidden rounded-l-2xl">
      {/* Browser Toolbar */}
      <div className="bg-white border-b border-slate-300 p-2 flex items-center space-x-4">
        <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex space-x-2 text-slate-400">
            <ChevronLeft size={16} />
            <ChevronRight size={16} />
            <RotateCcw size={16} />
        </div>
        <div className="flex-1 bg-slate-100 rounded-md px-3 py-1.5 text-xs text-slate-600 flex items-center">
            <Lock size={12} className="mr-2 text-green-600" />
            {simulatedUrl}
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="relative flex-1 bg-white overflow-hidden p-8 font-sans">
        {/* Simulated Web Content */}
        <div className="max-w-3xl mx-auto space-y-6 opacity-90 transition-opacity duration-500">
            <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse mb-8"></div>
            
            <div className="space-y-4">
                <div className="p-6 border border-slate-200 rounded-lg shadow-sm">
                    <div className="h-4 w-1/4 bg-slate-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded flex items-center px-3">
                           {currentStep?.action === 'fill' && currentStep.target.includes('username') && (
                               <span className="text-slate-800 text-sm animate-typing">{currentStep.value}</span>
                           )}
                        </div>
                        <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded flex items-center px-3">
                           {currentStep?.action === 'fill' && currentStep.target.includes('password') && (
                               <span className="text-slate-800 text-sm">••••••••</span>
                           )}
                        </div>
                    </div>
                    <div className="mt-4 h-10 w-32 bg-blue-600 rounded opacity-20"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="h-32 bg-slate-100 rounded border border-slate-200"></div>
                     <div className="h-32 bg-slate-100 rounded border border-slate-200"></div>
                </div>
            </div>
        </div>

        {/* Action Overlay */}
        {status === AutomationStatus.Running && currentStep && (
            <div className="absolute top-4 right-4 bg-slate-900/80 text-white p-4 rounded-lg shadow-lg max-w-xs backdrop-blur-sm transition-all duration-300">
                <div className="flex items-start space-x-3">
                    <div className="mt-1">
                        {currentStep.action === 'click' ? <MousePointer size={18} /> : <CheckCircle size={18} />}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                            {task?.type === 'prerecorded' ? 'Guided Playback' : 'AI Navigation'}
                        </p>
                        <p className="text-sm font-medium mt-1">{currentStep.description}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{currentStep.action} -> {currentStep.target}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Fake Cursor */}
        {status === AutomationStatus.Running && (
            <div 
                className="absolute w-6 h-6 pointer-events-none transition-all duration-1000 ease-in-out z-50"
                style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
            >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 3.5L19 10L11.5 12L9 19L5.5 3.5Z" fill="black" stroke="white" strokeWidth="2"/>
                </svg>
            </div>
        )}
      </div>
    </div>
  );
};

export default BrowserSimulation;
