import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, Attachment, UserDetails } from '../types';
import { Send, User, Bot, Loader2, Paperclip, X, File, MessageSquare, Mic as MicIcon, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VoiceControls from './VoiceControls';
import DataReviewCard from './DataReviewCard';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onConfirmData: (data: UserDetails) => void;
  isProcessing: boolean;
  showBrowser: boolean;
  onToggleBrowser: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onConfirmData, isProcessing, showBrowser, onToggleBrowser }) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((inputText.trim() || attachments.length > 0) && !isProcessing) {
      onSendMessage(inputText, attachments);
      setInputText('');
      setAttachments([]);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    if (text.trim()) {
      onSendMessage(text, []); 
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newAttachments.push({
              name: file.name,
              type: file.type,
              data: event.target.result as string
            });
            if (newAttachments.length === e.target!.files!.length) {
              setAttachments(prev => [...prev, ...newAttachments]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white z-10 sticky top-0 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GovAssist AI</h1>
            <p className="text-xs text-slate-500 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Online • Multilingual
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
            {/* Browser Toggle */}
            <button
                onClick={onToggleBrowser}
                className={`p-2 rounded-lg transition-colors ${showBrowser ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                title={showBrowser ? "Hide Live Browser" : "Show Live Browser"}
            >
                {showBrowser ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            {/* Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                <button
                    onClick={() => setMode('chat')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'chat' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare size={16} />
                </button>
                <button
                    onClick={() => setMode('voice')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'voice' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MicIcon size={16} />
                </button>
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
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 mx-2 shadow-sm ${
                msg.sender === Sender.User ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.sender === Sender.User ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="flex flex-col space-y-1 w-full">
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === Sender.User 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {/* Render Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {msg.attachments.map((att, idx) => (
                                <div key={idx} className={`flex items-center space-x-2 p-2 rounded-md ${msg.sender === Sender.User ? 'bg-indigo-700/50' : 'bg-slate-100'}`}>
                                    {att.type.startsWith('image/') ? (
                                        <img src={att.data} alt={att.name} className="w-12 h-12 object-cover rounded" />
                                    ) : (
                                        <File size={24} />
                                    )}
                                    <span className="text-xs truncate max-w-[150px]">{att.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    {msg.isReview && msg.reviewData ? (
                        <DataReviewCard data={msg.reviewData} onConfirm={onConfirmData} />
                    ) : (
                        msg.sender === Sender.Agent ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        ) : (
                        <p>{msg.text}</p>
                        )
                    )}
                  </div>
                  <span className={`text-[10px] px-1 ${msg.sender === Sender.User ? 'text-right text-slate-400' : 'text-slate-400'}`}>
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
      <div className="bg-white border-t border-slate-100">
        {mode === 'voice' ? (
             <div className="p-4 bg-slate-50 min-h-[160px] flex items-center justify-center">
                 <VoiceControls 
                    onTranscript={handleVoiceTranscript} 
                    isProcessing={isProcessing} 
                    variant="large" 
                 />
             </div>
        ) : (
            <div className="p-4">
                 {/* Attachment Preview with Label */}
                 {attachments.length > 0 && (
                    <div className="mb-3 animate-fade-in-up">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-1">Attachments</div>
                        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative group flex-shrink-0">
                                    <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                                        {att.type.startsWith('image/') ? (
                                            <img src={att.data} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <File size={24} className="text-slate-400" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(i)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 hover:scale-110 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 <form onSubmit={handleSubmit} className="relative flex items-end space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mb-0.5"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        multiple 
                        accept="image/*,application/pdf"
                    />

                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-3 text-slate-800 placeholder:text-slate-400 max-h-32"
                        disabled={isProcessing}
                    />
                    
                    <div className="flex items-center space-x-1 pr-1 mb-0.5">
                        <VoiceControls onTranscript={handleVoiceTranscript} isProcessing={isProcessing} variant="icon" />
                        
                        {(inputText.trim() || attachments.length > 0) && (
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
            </div>
        )}
        <div className="text-center pb-2">
            <p className="text-[10px] text-slate-400">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;