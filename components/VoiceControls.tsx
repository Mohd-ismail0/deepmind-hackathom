import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  variant?: 'icon' | 'large';
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ onTranscript, isProcessing, variant = 'icon' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = false;
      newRecognition.interimResults = false;
      newRecognition.lang = 'en-US';

      newRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      newRecognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      newRecognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(newRecognition);
    }
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  if (variant === 'large') {
    return (
       <div className="flex flex-col items-center justify-center space-y-6 py-8 w-full">
          <div className="relative">
             {isListening && (
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
             )}
             <button
                onClick={toggleListening}
                disabled={isProcessing || !recognition}
                className={`relative z-10 p-8 rounded-full transition-all shadow-xl ${
                    isListening
                        ? 'bg-red-500 text-white'
                        : isProcessing
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
             >
                {isListening ? <MicOff size={48} /> : <Mic size={48} />}
             </button>
          </div>
          <p className="text-slate-500 font-medium">
             {isListening ? "Listening..." : isProcessing ? "Processing..." : "Tap to Speak"}
          </p>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                isMuted ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? "Voice Output Off" : "Voice Output On"}</span>
          </button>
       </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`p-2 rounded-full transition-colors ${
          isMuted ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'
        }`}
        title={isMuted ? "Unmute TTS" : "Mute TTS"}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <button
        onClick={toggleListening}
        disabled={isProcessing || !recognition}
        className={`p-3 rounded-full transition-all shadow-md ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : isProcessing
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title="Voice Input"
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
};

export default VoiceControls;