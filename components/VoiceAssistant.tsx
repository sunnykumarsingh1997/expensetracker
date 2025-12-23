'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceAssistantProps {
  onCommand?: (data: Record<string, unknown>, type: string) => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const configRef = useRef<{ apiKey: string; googleSheetId: string; userId: string; username: string } | null>(null);

  // Fetch connection config from our API
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/voice/realtime');
      const data = await response.json();
      if (data.success) {
        configRef.current = {
          apiKey: data.data.apiKey,
          googleSheetId: data.data.googleSheetId,
          userId: data.data.userId,
          username: data.data.username,
        };
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get config');
      }
    } catch (error) {
      console.error('Failed to fetch voice config:', error);
      toast.error('Failed to initialize voice assistant');
      return null;
    }
  }, []);

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    const config = await fetchConfig();
    if (!config) {
      setConnectionStatus('error');
      return;
    }

    try {
      const ws = new WebSocket(config.url, [
        'realtime',
        `openai-insecure-api-key.${config.apiKey}`,
        'openai-beta.realtime-v1',
      ]);

      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        setConnectionStatus('connected');
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: config.sessionConfig,
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeEvent(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        toast.error('Voice connection error');
      };

      ws.onclose = () => {
        console.log('Disconnected from OpenAI Realtime API');
        setConnectionStatus('disconnected');
        setIsListening(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('error');
    }
  }, [fetchConfig]);

  // Handle events from OpenAI Realtime API
  const handleRealtimeEvent = useCallback(async (event: Record<string, unknown>) => {
    switch (event.type) {
      case 'session.created':
        console.log('Session created');
        break;

      case 'session.updated':
        console.log('Session updated');
        break;

      case 'input_audio_buffer.speech_started':
        setIsAiSpeaking(false);
        break;

      case 'input_audio_buffer.speech_stopped':
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (typeof event.transcript === 'string') {
          setTranscript(event.transcript);
        }
        break;

      case 'response.audio_transcript.delta':
        if (typeof event.delta === 'string') {
          setAiResponse((prev) => prev + event.delta);
        }
        break;

      case 'response.audio_transcript.done':
        break;

      case 'response.audio.delta':
        if (typeof event.delta === 'string' && !isMuted) {
          const audioData = base64ToInt16Array(event.delta);
          playbackQueueRef.current.push(audioData);
          if (!isPlayingRef.current) {
            playAudioQueue();
          }
        }
        break;

      case 'response.audio.done':
        setIsAiSpeaking(false);
        break;

      case 'response.done':
        setAiResponse('');
        break;

      case 'response.function_call_arguments.done': {
        // Handle function calls
        const { call_id, name, arguments: args } = event as {
          call_id: string;
          name: string;
          arguments: string;
        };
        
        await handleFunctionCall(call_id, name, args);
        break;
      }

      case 'error':
        console.error('Realtime API error:', event);
        const errorMsg = (event.error as { message?: string })?.message || 'Unknown error';
        toast.error(`Voice error: ${errorMsg}`);
        break;

      default:
        // Log unknown events for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Unhandled event:', event.type);
        }
    }
  }, [isMuted]);

  // Handle function calls from the AI
  const handleFunctionCall = async (callId: string, functionName: string, argsString: string) => {
    try {
      // Call our backend to execute the function
      const response = await fetch('/api/voice/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName,
          arguments: argsString,
          callId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send function result back to OpenAI
        wsRef.current?.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: data.result,
          },
        }));

        // Trigger response generation
        wsRef.current?.send(JSON.stringify({
          type: 'response.create',
        }));

        // Parse result and notify parent component
        const result = JSON.parse(data.result);
        if (result.success && onCommand) {
          const args = JSON.parse(argsString);
          onCommand(args, functionName);
        }

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Function call error:', error);
      toast.error('Failed to execute command');
    }
  };

  // Start microphone and audio capture
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && isListening) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = float32ToPcm16(inputData);
          const base64 = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      setTranscript('');
      setAiResponse('');
    } catch (error) {
      console.error('Failed to start listening:', error);
      toast.error('Failed to access microphone');
    }
  }, [connect, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    stopListening();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [stopListening]);

  // Play audio from queue
  const playAudioQueue = useCallback(async () => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    setIsAiSpeaking(true);

    const audioContext = new AudioContext({ sampleRate: 24000 });
    
    while (playbackQueueRef.current.length > 0) {
      const audioData = playbackQueueRef.current.shift()!;
      const float32 = pcm16ToFloat32(audioData);
      
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

      await new Promise((resolve) => {
        source.onended = resolve;
      });
    }

    await audioContext.close();
    isPlayingRef.current = false;
    setIsAiSpeaking(false);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    disconnect();
    setIsOpen(false);
    setTranscript('');
    setAiResponse('');
  }, [disconnect]);

  // Auto-connect when modal opens
  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected') {
      connect();
    }
  }, [isOpen, connectionStatus, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Audio conversion utilities
  function float32ToPcm16(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }

  function pcm16ToFloat32(pcm16Array: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16Array.length);
    for (let i = 0; i < pcm16Array.length; i++) {
      float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7fff);
    }
    return float32;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToInt16Array(base64: string): Int16Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg flex items-center justify-center hover:from-red-700 hover:to-red-800 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Mic className="w-6 h-6 text-white" />
        {connectionStatus === 'connected' && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
        )}
      </motion.button>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md mx-4 bg-gradient-to-b from-gray-900 to-black border border-red-900/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Mic className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI Voice Assistant</h3>
                    <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
                      {getStatusIcon()}
                      <span className="capitalize">{connectionStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-full transition-colors ${
                      isMuted ? 'bg-red-600/20 text-red-400' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 min-h-[300px] flex flex-col">
                {/* Transcripts */}
                <div className="flex-1 space-y-4 mb-6">
                  {transcript && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">You said:</p>
                      <p className="text-white">{transcript}</p>
                    </div>
                  )}
                  {aiResponse && (
                    <div className="bg-red-900/20 rounded-lg p-4 border border-red-900/30">
                      <p className="text-xs text-red-400 mb-1">AI Response:</p>
                      <p className="text-gray-200">{aiResponse}</p>
                    </div>
                  )}
                  {!transcript && !aiResponse && connectionStatus === 'connected' && (
                    <div className="text-center text-gray-500 py-8">
                      <p className="mb-2">Press and hold the microphone to speak</p>
                      <p className="text-sm">Say something like:</p>
                      <p className="text-red-400 text-sm mt-2">&quot;Add expense 500 rupees for lunch&quot;</p>
                      <p className="text-red-400 text-sm">&quot;Maine 200 rupaye chai pe kharch kiye&quot;</p>
                    </div>
                  )}
                  {connectionStatus === 'connecting' && (
                    <div className="text-center text-gray-500 py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-400" />
                      <p>Connecting to AI...</p>
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="text-center text-red-400 py-8">
                      <WifiOff className="w-8 h-8 mx-auto mb-4" />
                      <p>Connection failed</p>
                      <button
                        onClick={connect}
                        className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white text-sm hover:bg-red-700 transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}
                </div>

                {/* Waveform visualization */}
                {isListening && (
                  <div className="flex items-center justify-center gap-1 h-12 mb-4">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-500 rounded-full"
                        animate={{
                          height: [8, Math.random() * 32 + 8, 8],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* AI Speaking indicator */}
                {isAiSpeaking && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-green-500 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-green-400 text-sm">AI is speaking...</span>
                  </div>
                )}

                {/* Microphone button */}
                <div className="flex justify-center">
                  <motion.button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onMouseLeave={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    disabled={connectionStatus !== 'connected'}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isListening
                        ? 'bg-red-600 shadow-lg shadow-red-600/50'
                        : connectionStatus === 'connected'
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                    whileTap={connectionStatus === 'connected' ? { scale: 0.95 } : {}}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </motion.button>
                </div>

                <p className="text-center text-gray-500 text-xs mt-4">
                  {connectionStatus === 'connected'
                    ? 'Hold to speak • Supports Hindi & English'
                    : 'Waiting for connection...'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
