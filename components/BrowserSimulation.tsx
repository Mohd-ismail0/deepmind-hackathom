import React, { useEffect, useState } from 'react';
import { AutomationTask, AutomationStep, AutomationStatus } from '../types';
import { Globe, Lock, MousePointer, Radio, Terminal } from 'lucide-react';

interface BrowserSimulationProps {
  task?: AutomationTask;
  status: AutomationStatus;
  currentStepIndex: number;
  screenshotBase64?: string | null;
  waitingForInput?: boolean;
}

const BrowserSimulation: React.FC<BrowserSimulationProps> = ({
  task,
  status,
  currentStepIndex,
  screenshotBase64,
  waitingForInput = false,
}) => {
  const [simulatedUrl, setSimulatedUrl] = useState('about:blank');

  useEffect(() => {
    if (task?.url) setSimulatedUrl(task.url);
  }, [task?.url]);

  if (!task && status === AutomationStatus.Idle) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
        <Globe size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-300">Remote Browser Disconnected</p>
        <p className="text-sm">Initiate a request to start the session.</p>
      </div>
    );
  }

  const currentStep = task?.steps[currentStepIndex];
  const isPrerecorded = task?.type === 'prerecorded';

  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700 shadow-2xl overflow-hidden rounded-l-none sm:rounded-l-2xl">
      <div className="bg-slate-900 border-b border-slate-700 p-2 flex items-center space-x-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>

        {task?.type === 'ai-navigated' && status === AutomationStatus.Running && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-red-900/30 rounded border border-red-800">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">LIVE AI</span>
          </div>
        )}
        {isPrerecorded && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-blue-900/30 rounded border border-blue-800">
            <Radio size={10} className="text-blue-400" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ADMIN RECORDING</span>
          </div>
        )}
        {waitingForInput && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-amber-900/30 rounded border border-amber-700">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Waiting for your input</span>
          </div>
        )}

        <div className="flex-1 bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-300 flex items-center border border-slate-700 font-mono min-w-0">
          <Lock size={12} className="mr-2 text-green-500 flex-shrink-0" />
          <span className="truncate">{simulatedUrl}</span>
        </div>
      </div>

      <div className="relative flex-1 bg-white overflow-hidden font-sans flex items-center justify-center">
        {screenshotBase64 ? (
          <img
            src={`data:image/png;base64,${screenshotBase64}`}
            alt="Browser view"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 p-8 w-full">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <div className="h-8 w-1/4 bg-blue-900 rounded"></div>
              <div className="flex space-x-4">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="hidden md:block w-1/4 space-y-4">
                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="p-8 border border-slate-200 rounded-xl shadow-sm bg-white">
                  <div className="h-6 w-1/3 bg-slate-800 rounded mb-6"></div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Input Field</label>
                      <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center px-4">
                        {currentStep?.action === 'fill' ? (
                          <span className="text-slate-800 text-sm font-medium border-r-2 border-blue-500 pr-1 animate-pulse">{currentStep.value}</span>
                        ) : (
                          <span className="text-slate-300 text-sm">...</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Input Field</label>
                      <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center px-4">
                        <span className="text-slate-300 text-sm">••••••••</span>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-8 h-12 w-full rounded-lg flex items-center justify-center text-white font-bold ${currentStep?.action === 'click' ? 'bg-blue-700 scale-[0.98]' : 'bg-blue-600'}`}>
                    {currentStep?.action === 'click' ? 'Processing...' : 'Submit'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === AutomationStatus.Running && currentStep && (
          <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white p-4 rounded-xl shadow-2xl max-w-sm backdrop-blur-md border border-slate-700">
            <div className="flex items-start space-x-3">
              <div className={`mt-1 p-1.5 rounded-full ${isPrerecorded ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                {currentStep.action === 'click' ? <MousePointer size={16} /> : <Terminal size={16} />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-0.5">
                  Step {currentStepIndex + 1}/{task?.steps.length}
                </p>
                <p className="text-sm font-medium">{currentStep.description}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono bg-black/30 p-1 rounded">
                  {'>'} {currentStep.action}(&quot;{currentStep.target}&quot;)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserSimulation;
