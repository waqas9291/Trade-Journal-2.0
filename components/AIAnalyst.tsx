import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Send, Image as ImageIcon, Zap, User, Loader2, Target, Mic, MicOff, Volume2, X, AlertTriangle, ExternalLink } from 'lucide-react';

interface AIAnalystProps {
    trades: Trade[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const SYSTEM_INSTRUCTION = `You are 'Mr. Wick', an institutional trading mentor. 
    Analyze the user's journal and provide specific ENTRY, SL, and TP levels when they ask about setups.
    JOURNAL CONTEXT: ${JSON.stringify(trades.slice(0, 10))}
    Tone: Professional, Stern, Actionable. Use trading terminology correctly (ICT/SMC).`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInitialize = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
        }
    };

    const sendMessage = async (promptText?: string) => {
        const text = promptText || input;
        if (!text.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: `${text}\n\nContext: My recent performance is ${JSON.stringify(trades.slice(0, 5))}` }] }],
                config: { 
                    systemInstruction: SYSTEM_INSTRUCTION,
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });

            const aiText = response.text;
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText || "Terminal signal lost. Awaiting reconnection." }]);
        } catch (error: any) {
            console.error("AI Error:", error);
            let msg = "Terminal offline. Re-initialize with a valid Paid API Key.";
            if (error?.message?.includes("Requested entity was not found")) {
                msg = "Frequency Error: Your API key is either invalid or restricted. Re-select a paid project key.";
            }
            setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', content: msg, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-900 rounded-xl">
                        <Zap className="h-5 w-5 text-gold-500" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Terminal Intelligence</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Frequency</p>
                    </div>
                </div>
                <button onClick={handleInitialize} className="text-[10px] font-black uppercase text-slate-400 hover:text-gold-500 transition-colors">
                    Re-link Terminal
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                        <Zap className="h-12 w-12 mb-4 animate-pulse text-gold-500" />
                        <p className="text-xs font-black uppercase tracking-widest italic text-slate-900 dark:text-white">Awaiting Frequency Link...</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-gold-500 text-slate-900 font-bold italic' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'} ${msg.isError ? 'border-rose-500 text-rose-500' : ''}`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            {msg.isError && (
                                <button onClick={handleInitialize} className="mt-4 w-full bg-rose-500 text-white text-[10px] font-black uppercase p-2 rounded-lg hover:bg-rose-600 transition-colors">
                                    Re-Initialize Terminal
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                    type="text" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Mr. Wick for setup analysis..."
                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:ring-1 focus:ring-gold-500 outline-none font-medium"
                />
                <button 
                    onClick={() => sendMessage()} 
                    disabled={isLoading || !input.trim()} 
                    className="p-4 bg-gold-600 hover:bg-gold-500 text-slate-900 rounded-2xl shadow-xl transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};
