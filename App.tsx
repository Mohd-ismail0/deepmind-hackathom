import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import BrowserSimulation from './components/BrowserSimulation';
import { sendMessageToGemini, generateAutomationSteps, startChatSession } from './services/geminiService';
import { Message, Sender, AutomationTask, AutomationStatus, UserDetails, AutomationStep } from './types';
import { PRERECORDED_PASSPORT_FLOW } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm GovAssist AI. I can help you apply for government documents like passports, licenses, and permits. How can I help you today?",
      sender: Sender.Agent,
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>(AutomationStatus.Idle);
  const [currentTask, setCurrentTask] = useState<AutomationTask | undefined>(undefined);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<UserDetails>({});

  // Initialize Chat Session
  useEffect(() => {
    startChatSession();
  }, []);

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.User,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      // 1. Send message to Gemini to understand intent and get response
      // We append collected data to context if needed, but the chat session holds history.
      const responseText = await sendMessageToGemini(text);
      
      // 2. Parse response for JSON blocks indicating automation start
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      let cleanText = responseText;
      
      if (jsonMatch) {
        try {
          const payload = JSON.parse(jsonMatch[1]);
          cleanText = responseText.replace(jsonMatch[0], '').trim();
          
          if (payload.intent === 'start_automation') {
             handleStartAutomation(payload);
          }
        } catch (e) {
          console.error("Failed to parse JSON from agent", e);
        }
      }

      const newAgentMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanText,
        sender: Sender.Agent,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAgentMsg]);
      
      // Optional: Text to speech here if enabled
      speakResponse(cleanText);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "I encountered a connection error. Please try again.",
        sender: Sender.Agent,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartAutomation = async (payload: any) => {
    setCollectedData(payload.data);
    const taskName = payload.taskName || "Unknown Task";
    
    // Determine if we use Prerecorded or AI Navigated
    let task: AutomationTask;

    if (taskName.toLowerCase().includes('passport')) {
      task = { 
        ...PRERECORDED_PASSPORT_FLOW, 
        // Inject data into values
        steps: PRERECORDED_PASSPORT_FLOW.steps.map(s => ({
            ...s,
            value: s.value ? s.value.replace(/\{(\w+)\}/g, (_, key) => (payload.data[key] as string) || '') : undefined
        }))
      };
    } else {
      // AI Navigated: Generate steps on the fly
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Creating a custom AI-guided plan for: **${taskName}**...`,
        sender: Sender.System,
        timestamp: Date.now()
      }]);
      
      const generatedSteps = await generateAutomationSteps(taskName);
      
      task = {
        name: taskName,
        type: 'ai-navigated',
        url: 'https://gov.service.portal/dynamic-application',
        steps: generatedSteps
      };
    }

    setCurrentTask(task);
    setAutomationStatus(AutomationStatus.Running);
    setCurrentStepIndex(0);
  };

  const handleStepComplete = useCallback(() => {
    if (!currentTask) return;

    if (currentStepIndex < currentTask.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setAutomationStatus(AutomationStatus.Completed);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `✅ **${currentTask.name}** successfully completed! The application has been submitted.`,
        sender: Sender.System,
        timestamp: Date.now()
      }]);
      setTimeout(() => setAutomationStatus(AutomationStatus.Idle), 5000);
    }
  }, [currentTask, currentStepIndex]);

  const speakResponse = (text: string) => {
    // Simple browser TTS fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      {/* Left Panel: Chat */}
      <div className={`transition-all duration-500 ease-in-out ${automationStatus !== AutomationStatus.Idle ? 'w-1/3 border-r border-slate-200' : 'w-full max-w-2xl mx-auto shadow-2xl my-8 rounded-2xl overflow-hidden h-[calc(100vh-4rem)] border border-slate-200'}`}>
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isProcessing={isProcessing} 
        />
      </div>

      {/* Right Panel: Browser Simulation */}
      <div className={`transition-all duration-500 ease-in-out bg-slate-800 ${automationStatus !== AutomationStatus.Idle ? 'w-2/3 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
         <BrowserSimulation 
            task={currentTask}
            status={automationStatus}
            currentStepIndex={currentStepIndex}
            onStepComplete={handleStepComplete}
         />
      </div>
    </div>
  );
};

export default App;
