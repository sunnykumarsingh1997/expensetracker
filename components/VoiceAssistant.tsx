'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Send, Loader2 } from 'lucide-react';
import { useVoiceStore } from '@/lib/store';
import toast from 'react-hot-toast';

// Web Speech API types for TypeScript
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface VoiceAssistantProps {
  onCommand: (data: any, type: 'expense' | 'income' | 'balance') => void;
}

export default function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);
  const [response, setResponse] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [commandType, setCommandType] = useState<'expense' | 'income' | 'balance' | null>(null);

  const {
    isListening,
    isProcessing,
    transcript,
    setListening,
    setProcessing,
    setTranscript,
    reset,
  } = useVoiceStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        const recognitionInstance = new SpeechRecognitionConstructor() as ISpeechRecognition;
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-IN';

        recognitionInstance.onstart = () => {
          setListening(true);
        };

        recognitionInstance.onresult = (event: ISpeechRecognitionEvent) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);
        };

        recognitionInstance.onend = () => {
          setListening(false);
          if (transcript) {
            processVoiceInput(transcript);
          }
        };

        recognitionInstance.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setListening(false);
          toast.error('Voice recognition failed. Please try again.');
        };

        setRecognition(recognitionInstance);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(data.data.response);
        setParsedData(data.data.parsedData);
        setCommandType(data.data.command.type);

        // Speak the response
        speak(data.data.response);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to process voice command');
    } finally {
      setProcessing(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      setResponse('');
      setParsedData(null);
      recognition.start();
    }
  }, [recognition, isListening, setTranscript]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const handleConfirm = () => {
    if (parsedData && commandType) {
      onCommand(parsedData, commandType);
      toast.success('Data added to form!');
      setIsOpen(false);
      reset();
      setResponse('');
      setParsedData(null);
    }
  };

  const handleClose = () => {
    stopListening();
    reset();
    setResponse('');
    setParsedData(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-hitman-red shadow-lg shadow-hitman-red/30 flex items-center justify-center text-white hover:bg-hitman-darkRed transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Mic className="w-7 h-7" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-hitman-charcoal rounded-2xl border border-hitman-gunmetal shadow-2xl overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-hitman-gunmetal">
                <h3 className="font-hitman text-lg font-bold text-white">
                  VOICE ASSISTANT
                </h3>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Voice visualization */}
                <div className="flex flex-col items-center">
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                      isListening
                        ? 'bg-hitman-red text-white'
                        : 'bg-hitman-gunmetal text-gray-400 hover:bg-hitman-red hover:text-white'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : isListening ? (
                      <>
                        <MicOff className="w-10 h-10 relative z-10" />
                        <motion.div
                          className="absolute inset-0 rounded-full bg-hitman-red"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </>
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </motion.button>

                  {isListening && (
                    <div className="voice-wave mt-4">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="bg-hitman-black/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">You said:</p>
                    <p className="text-white">{transcript}</p>
                  </div>
                )}

                {/* Response */}
                {response && (
                  <div className="bg-hitman-red/10 border border-hitman-red/30 rounded-xl p-4">
                    <p className="text-xs text-hitman-red mb-1">Assistant:</p>
                    <p className="text-gray-300">{response}</p>
                  </div>
                )}

                {/* Parsed data preview */}
                {parsedData && Object.keys(parsedData).length > 0 && (
                  <div className="bg-hitman-gunmetal/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Parsed data:</p>
                    {Object.entries(parsedData).map(([key, value]) =>
                      value ? (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-white font-medium">{String(value)}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}

                {/* Actions */}
                {parsedData && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-hitman-gunmetal text-gray-300 font-medium hover:bg-hitman-gunmetal/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 py-3 px-4 rounded-xl bg-hitman-red text-white font-medium hover:bg-hitman-darkRed transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Use Data
                    </button>
                  </div>
                )}

                {/* Instructions */}
                {!transcript && !isListening && (
                  <p className="text-center text-gray-500 text-sm">
                    Tap the microphone and say something like:
                    <br />
                    <span className="text-hitman-silver">
                      "Add expense 500 rupees for lunch"
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
