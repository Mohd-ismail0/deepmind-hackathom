import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender } from '../types';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VoiceControls from './VoiceControls';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (text.trim()) {
      onSendMessage(text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GovAssist AI</h1>
            <p className="text-xs text-slate-500 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online • Multilingual Support
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] ${msg.sender === Sender.User ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 mx-2 shadow-sm ${
                msg.sender === Sender.User ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.sender === Sender.User ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                msg.sender === Sender.User 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.sender === Sender.Agent ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className={`text-[10px] mt-2 block opacity-60 ${msg.sender === Sender.User ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start w-full">
               <div className="flex flex-row items-center space-x-3 ml-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                        <span className="text-xs text-slate-500 font-medium">Processing...</span>
                    </div>
               </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative flex items-center space-x-2 bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or speak..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 text-slate-800 placeholder:text-slate-400"
            disabled={isProcessing}
          />
          
          <div className="flex items-center space-x-1 pr-1">
             <VoiceControls onTranscript={handleVoiceTranscript} isProcessing={isProcessing} />
             
             {inputText.trim() && (
                <button
                    type="submit"
                    disabled={isProcessing}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
             )}
          </div>
        </form>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
