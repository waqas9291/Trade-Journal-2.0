
import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Send, Image as ImageIcon, Zap, User, Loader2, Target, Mic, MicOff, Volume2, X } from 'lucide-react';

interface AIAnalystProps {
    trades: Trade[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    isError?: boolean;
}

// Manual Audio Encoding & Decoding for Gemini Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [liveTranscription, setLiveTranscription] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);

    const SYSTEM_INSTRUCTION = `You are 'Mr. Wick', a legendary, disciplined, and high-stakes trading floor mentor. 
    YOUR MISSION: Provide fully executable trade insights (signals) and call out strategy leaks.
    
    DATA CONTEXT: You have access to the user's trade journal. 
    - If they win on Gold breakouts, tell them to wait for gold breakouts.
    - If they lose on USDJPY reversals, warn them when they mention USDJPY.
    - Be decisive. Provide specific "ENTRY", "STOP LOSS", and "TAKE PROFIT" levels when a setup is mentioned.
    - Keep answers concise, stern, and actionable. No fluff. No generic advice.
    - You are talking to a professional trader. Act like one.`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, liveTranscription]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const startLiveSession = async () => {
        try {
            setIsLive(true);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            sessionPromise.then((session: any) => {
                                session.sendRealtimeInput({ 
                                    media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                                });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const content = msg.serverContent;
                        if (!content) return;

                        // Handle Transcriptions
                        if (content.outputTranscription) {
                            setLiveTranscription(prev => prev + content.outputTranscription!.text);
                        }
                        
                        // Handle Audio Output
                        const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            sourcesRef.current.add(source);
                            source.onended = () => sourcesRef.current.delete(source);
                        }

                        if (content.interrupted) {
                            sourcesRef.current.forEach(s => {
                                try { s.stop(); } catch(e) {}
                            });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }

                        if (content.turnComplete) {
                            setLiveTranscription('');
                        }
                    },
                    onerror: (e: any) => {
                        console.error("Live AI Error:", e);
                        stopLiveSession();
                    },
                    onclose: () => stopLiveSession()
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: `${SYSTEM_INSTRUCTION}\n\nContext of user trades: ${JSON.stringify(trades.slice(0, 10))}`,
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    outputAudioTranscription: {}
                }
            });

            sessionPromiseRef.current = sessionPromise;
        } catch (err) {
            console.error(err);
            setIsLive(false);
        }
    };

    const stopLiveSession = () => {
        setIsLive(false);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((s: any) => {
                try { s.close(); } catch(e) {}
            });
        }
        inputAudioContextRef.current?.close().catch(() => {});
        outputAudioContextRef.current?.close().catch(() => {});
        sourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        sourcesRef.current.clear();
        setLiveTranscription('');
    };

    const sendMessage = async (overrideText?: string) => {
        const text = overrideText || input;
        if (!text && !selectedImage) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const parts: any[] = [{ text: `${text}\n\nJournal context: ${JSON.stringify(trades.slice(0, 15))}` }];
            if (selectedImage) {
                parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: selectedImage.split(',')[1] } });
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts }],
                config: { systemInstruction: SYSTEM_INSTRUCTION }
            });

            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response.text || '' }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "Lost connection to the trade floor. Try again.", isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-all ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}>
                        <Zap className={`h-6 w-6 ${isLive ? 'text-white' : 'text-gold-500'}`} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Mr. Wick
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 font-mono">ELITE MENTOR</span>
                        </h2>
                        <p className="text-xs text-green-500 font-medium flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-1 ${isLive ? 'bg-rose-500' : 'bg-green-500 animate-pulse'}`}></span>
                            {isLive ? 'Listening...' : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => isLive ? stopLiveSession() : startLiveSession()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isLive ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gold-500 hover:text-white shadow-sm'}`}
                    >
                        {isLive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isLive ? 'Stop Feed' : 'Voice Mode'}
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50 relative">
                {isLive && (
                    <div className="absolute inset-0 z-10 bg-slate-950/90 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 backdrop-blur-sm">
                        <div className="w-32 h-32 bg-rose-500/10 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-4 bg-rose-500/40 rounded-full animate-pulse"></div>
                            <Volume2 className="h-12 w-12 text-rose-500 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Live Frequency Active</h3>
                        <p className="text-slate-400 text-sm max-w-xs mb-10 leading-relaxed font-medium">Describe your current chart setup or ask for decisive entry levels.</p>
                        
                        <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[120px] flex items-center justify-center shadow-2xl">
                            <p className="text-rose-400 font-mono italic text-sm leading-relaxed">
                                {liveTranscription || "Awaiting voice input..."}
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center mx-2 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-slate-950 border border-gold-500/30'}`}>
                                {msg.role === 'user' ? <User className="h-4 w-4 text-slate-400" /> : <Zap className="h-4 w-4 text-gold-500" />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none font-medium' : 'bg-white dark:bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                                {msg.image && <img src={msg.image} className="rounded-lg mb-3 max-h-64 border border-white/10" />}
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-700 shrink-0">
                {selectedImage && (
                    <div className="mb-3 inline-flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <ImageIcon className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Chart Attached</span>
                        <button onClick={() => setSelectedImage(null)} className="ml-2 text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                )}
                <div className="flex gap-2">
                    <button 
                        onClick={() => sendMessage("Analyze my journal data and provide 3 specific trade signals for today's market.")} 
                        className="p-3 bg-slate-900 text-gold-500 rounded-xl hover:bg-slate-950 transition-colors border border-gold-500/20" 
                        title="Get Executable Signals"
                    >
                        <Target className="h-5 w-5" />
                    </button>
                    <label className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl cursor-pointer hover:bg-slate-600">
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        <ImageIcon className="h-5 w-5" />
                    </label>
                    <input
                        type="text" value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Describe your setup..."
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                    />
                    <button onClick={() => sendMessage()} disabled={isLoading || (!input && !selectedImage)} className="p-3 bg-gold-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

