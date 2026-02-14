import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import BrowserSimulation from './components/BrowserSimulation';
import { sendMessageToGemini, generateAutomationSteps, startChatSession, findGovernmentUrl, extractDocumentDetails } from './services/geminiService';
import { Message, Sender, AutomationTask, AutomationStatus, UserDetails, AutomationStep, Attachment } from './types';
import { PRERECORDED_PASSPORT_FLOW } from './constants';

const App: React.FC = () => {
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
  const [collectedData, setCollectedData] = useState<UserDetails>({});
  
  // Browser Visibility State
  const [showBrowser, setShowBrowser] = useState(false);

  // Initialize Chat Session
  useEffect(() => {
    startChatSession();
  }, []);

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
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
      let extraDataMsg: Message | null = null;

      // 1. Intercept Attachments for Extraction
      if (attachments.length > 0) {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + "_proc",
            text: "Processing document for official details...",
            sender: Sender.System,
            timestamp: Date.now()
        }]);

        // Just process the first one for now or loop
        const extracted = await extractDocumentDetails(attachments[0]);
        
        // Add a "Review" Card Message
        extraDataMsg = {
            id: Date.now().toString() + "_review",
            text: "",
            sender: Sender.System,
            timestamp: Date.now(),
            isReview: true,
            reviewData: extracted
        };
      }

      // 2. Send message to Gemini to understand intent and get response
      const responseText = await sendMessageToGemini(text, attachments);
      
      // 3. Parse response for JSON blocks indicating automation start
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      let cleanText = responseText;
      let payload = null;

      if (jsonMatch) {
        try {
          payload = JSON.parse(jsonMatch[1]);
          cleanText = responseText.replace(jsonMatch[0], '').trim();
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

      setMessages(prev => {
          const arr = [...prev, newAgentMsg];
          if (extraDataMsg) arr.push(extraDataMsg);
          return arr;
      });
      
      if (cleanText) speakResponse(cleanText);

      // 4. Trigger Automation if payload exists (And we assume data is confirmed previously or now)
      if (payload && payload.intent === 'start_automation') {
          await handleStartAutomation(payload);
      }

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

  const handleConfirmData = async (data: UserDetails) => {
      setCollectedData(prev => ({ ...prev, ...data }));
      
      // Send a hidden message to context to inform Agent that data is verified
      const confirmationText = `I have verified the following details from the document: ${JSON.stringify(data)}. You may proceed with the next steps or automation.`;
      
      setIsProcessing(true);
      try {
          const responseText = await sendMessageToGemini(confirmationText);
          
          // Check if the agent decides to start automation immediately after confirmation
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
          let cleanText = responseText;
          let payload = null;
          
          if (jsonMatch) {
             try {
               payload = JSON.parse(jsonMatch[1]);
               cleanText = responseText.replace(jsonMatch[0], '').trim();
             } catch(e) {}
          }

          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: cleanText,
              sender: Sender.Agent,
              timestamp: Date.now()
          }]);
          
          if (payload && payload.intent === 'start_automation') {
            await handleStartAutomation(payload);
          }

      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleStartAutomation = async (payload: any) => {
    // Merge any data from payload with what we already collected/verified
    const finalData = { ...collectedData, ...payload.data };
    setCollectedData(finalData);

    const taskName = payload.taskName || "Unknown Task";
    let task: AutomationTask;

    // Check if it's a pre-recorded flow (Admin configured)
    const isPreRecorded = taskName.toLowerCase().includes('passport');

    if (isPreRecorded) {
      task = { 
        ...PRERECORDED_PASSPORT_FLOW, 
        // Inject data into values
        steps: PRERECORDED_PASSPORT_FLOW.steps.map(s => ({
            ...s,
            value: s.value ? s.value.replace(/\{(\w+)\}/g, (_, key) => (finalData[key] as string) || '') : undefined
        }))
      };
      
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `**System:** Initiating admin-verified automation for ${taskName}.`,
          sender: Sender.System,
          timestamp: Date.now()
      }]);

    } else {
      // AI Navigated: 1. Search for URL, 2. Generate Playwright Steps
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `**System:** No pre-recorded flow found. Searching government portals for **${taskName}**...`,
        sender: Sender.System,
        timestamp: Date.now()
      }]);
      
      const foundUrl = await findGovernmentUrl(taskName);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `**System:** Found portal: [${foundUrl}](${foundUrl}). Generating live automation plan...`,
        sender: Sender.System,
        timestamp: Date.now()
      }]);

      const generatedSteps = await generateAutomationSteps(taskName, foundUrl);
      
      task = {
        name: taskName,
        type: 'ai-navigated',
        url: foundUrl,
        steps: generatedSteps
      };
    }

    setCurrentTask(task);
    setAutomationStatus(AutomationStatus.Running);
    setCurrentStepIndex(0);
    // Auto show browser when automation starts
    setShowBrowser(true); 
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
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      {/* Left Panel: Chat */}
      <div className={`transition-all duration-500 ease-in-out ${showBrowser ? 'w-1/3 border-r border-slate-200' : 'w-full max-w-2xl mx-auto shadow-2xl my-8 rounded-2xl overflow-hidden h-[calc(100vh-4rem)] border border-slate-200'}`}>
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onConfirmData={handleConfirmData}
          isProcessing={isProcessing}
          showBrowser={showBrowser}
          onToggleBrowser={() => setShowBrowser(!showBrowser)}
        />
      </div>

      {/* Right Panel: Browser Simulation (Only visible if showBrowser is true) */}
      <div className={`transition-all duration-500 ease-in-out bg-slate-800 ${showBrowser ? 'w-2/3 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}>
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