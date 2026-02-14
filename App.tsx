import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import BrowserSimulation from './components/BrowserSimulation';
import * as apiClient from './services/apiClient';
import { Message, Sender, AutomationTask, AutomationStatus, UserDetails, Attachment } from './types';

function generateSessionId(): string {
  return crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapBackendStatus(status: apiClient.AutomationStatusBackend): AutomationStatus {
  switch (status) {
    case 'running':
    case 'waiting_input':
      return AutomationStatus.Running;
    case 'completed':
      return AutomationStatus.Completed;
    case 'failed':
      return AutomationStatus.Failed;
    default:
      return AutomationStatus.Idle;
  }
}

const App: React.FC = () => {
  const [sessionId] = useState(() => generateSessionId());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm GovAssist AI. I can help you apply for government documents like passports, licenses, and permits. To get started, please tell me what you need, and I'll likely ask you to upload your official ID or documents.",
      sender: Sender.Agent,
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>(AutomationStatus.Idle);
  const [currentTask, setCurrentTask] = useState<AutomationTask | undefined>(undefined);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [automationScreenshot, setAutomationScreenshot] = useState<string | null>(null);
  const [waitingForAutomationInput, setWaitingForAutomationInput] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speakResponse = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const pollAutomationStatus = useCallback(async () => {
    try {
      const data = await apiClient.getAutomationStatus(sessionId);
      setAutomationStatus(mapBackendStatus(data.status));
      setCurrentStepIndex(data.currentStepIndex);
      setCurrentTask(data.task ?? undefined);
      setAutomationScreenshot(data.screenshotBase64 ?? null);
      if (data.needInput) {
        setWaitingForAutomationInput(data.needInput);
      }
      if (data.status === 'completed') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `✅ **${data.task?.name ?? 'Task'}** successfully completed! The application has been submitted.`,
          sender: Sender.System,
          timestamp: Date.now()
        }]);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setTimeout(() => setAutomationStatus(AutomationStatus.Idle), 5000);
      }
      if (data.status === 'failed' && data.errorMessage) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `**System:** Automation failed. ${data.errorMessage}`,
          sender: Sender.System,
          timestamp: Date.now()
        }]);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch (err) {
      console.error('Poll automation status error', err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (automationStatus !== AutomationStatus.Running || !currentTask) return;
    pollRef.current = setInterval(pollAutomationStatus, 1500);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [automationStatus, currentTask, pollAutomationStatus]);

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (waitingForAutomationInput) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text,
        sender: Sender.User,
        timestamp: Date.now()
      }]);
      setIsProcessing(true);
      try {
        await apiClient.postAutomationInput(sessionId, text);
        setWaitingForAutomationInput(null);
        await pollAutomationStatus();
      } catch (err) {
        const e = err as Error & { code?: string; details?: unknown };
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: e?.message || 'Failed to send input. Please try again.',
          sender: Sender.Agent,
          timestamp: Date.now()
        }]);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.User,
      timestamp: Date.now(),
      attachments
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      if (attachments.length > 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '_proc',
          text: 'Processing document for official details...',
          sender: Sender.System,
          timestamp: Date.now()
        }]);
      }

      const data = await apiClient.postChat(sessionId, text, attachments);

      const newAgentMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: Sender.Agent,
        timestamp: Date.now()
      };

      setMessages(prev => {
        const arr = [...prev, newAgentMsg];
        if (data.reviewData) {
          arr.push({
            id: Date.now().toString() + '_review',
            text: '',
            sender: Sender.System,
            timestamp: Date.now(),
            isReview: true,
            reviewData: data.reviewData
          });
        }
        return arr;
      });

      if (data.reply) speakResponse(data.reply);

      if (data.automation) {
        setCurrentTask(data.automation.task);
        setAutomationStatus(AutomationStatus.Running);
        setCurrentStepIndex(0);
        setShowBrowser(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `**System:** Initiating automation for **${data.automation.task.name}**.`,
          sender: Sender.System,
          timestamp: Date.now()
        }]);
      }
    } catch (err) {
      const e = err as Error & { code?: string; details?: unknown };
      const detailsStr = e.details != null ? `\n\nDetails: ${JSON.stringify(e.details)}` : '';
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: (e?.message || 'I encountered a connection error. Please try again.') + detailsStr,
        sender: Sender.Agent,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmData = async (data: UserDetails) => {
    setIsProcessing(true);
    try {
      const res = await apiClient.postConfirmData(sessionId, data);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: res.reply,
        sender: Sender.Agent,
        timestamp: Date.now()
      }]);

      if (res.reply) speakResponse(res.reply);

      if (res.automation) {
        setCurrentTask(res.automation.task);
        setAutomationStatus(AutomationStatus.Running);
        setCurrentStepIndex(0);
        setShowBrowser(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `**System:** Initiating automation for **${res.automation.task.name}**.`,
          sender: Sender.System,
          timestamp: Date.now()
        }]);
      }
    } catch (err) {
      const e = err as Error & { code?: string; details?: unknown };
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: e?.message || 'Something went wrong. Please try again.',
        sender: Sender.Agent,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <div className={`transition-all duration-500 ease-in-out ${showBrowser ? 'w-1/3 border-r border-slate-200' : 'w-full max-w-2xl mx-auto shadow-2xl my-8 rounded-2xl overflow-hidden h-[calc(100vh-4rem)] border border-slate-200'}`}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onConfirmData={handleConfirmData}
          isProcessing={isProcessing}
          showBrowser={showBrowser}
          onToggleBrowser={() => setShowBrowser(!showBrowser)}
          waitingForAutomationInput={waitingForAutomationInput}
          isMuted={isMuted}
          onMuteChange={setIsMuted}
        />
      </div>
      <div className={`transition-all duration-500 ease-in-out bg-slate-800 ${showBrowser ? 'w-2/3 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}>
        <BrowserSimulation
          task={currentTask}
          status={automationStatus}
          currentStepIndex={currentStepIndex}
          screenshotBase64={automationScreenshot}
          waitingForInput={!!waitingForAutomationInput}
        />
      </div>
    </div>
  );
};

export default App;
