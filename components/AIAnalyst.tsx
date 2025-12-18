import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Send, Zap, Loader2, Key, AlertCircle } from 'lucide-react';

export const AIAnalyst: React.FC<{ trades: Trade[] }> = ({ trades }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const SYSTEM = `You are Mr. Wick, an institutional SMC/ICT mentor. Provide ENTRY, STOP LOSS, and TARGETS. 
    Tone: Stern, Actionable, Elite.
    Data: ${JSON.stringify(trades.slice(0, 10))}`;

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSetup = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setMessages(prev => [...prev, { id: 'sys', role: 'assistant', content: "Frequency secured. I am online. What is your query?" }]);
        }
    };

    const sendMessage = async () => {
        if (!input) return;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: input }]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: input }] }],
                config: { systemInstruction: SYSTEM }
            });
            setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', content: response.text || '' }]);
        } catch (error: any) {
            let msg = "Terminal offline. Verify Paid API Key.";
            if (error?.message?.includes('entity was not found')) msg = "Selected key is not from a paid project. Re-select.";
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: msg, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-gold-500" />
                    <h2 className="font-black text-white uppercase italic tracking-tighter">Terminal Intel</h2>
                </div>
                <button onClick={handleSetup} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gold-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <Key className="h-3 w-3" /> Initialize Terminal
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <Zap className="h-12 w-12 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest italic">Awaiting secure connection...</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-gold-500 text-slate-900 font-bold italic' : 'bg-slate-800 text-slate-200 border border-slate-700'} ${msg.isError ? 'border-rose-500/50 bg-rose-500/5 text-rose-500' : ''}`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            {msg.isError && <button onClick={handleSetup} className="mt-2 text-[10px] font-black uppercase bg-rose-500 text-white px-2 py-1 rounded">Re-initialize</button>}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input 
                    type="text" value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Mr. Wick for a signal or performance review..." 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-1 focus:ring-gold-500" 
                />
                <button onClick={sendMessage} disabled={isLoading} className="p-4 bg-gold-600 text-slate-900 rounded-2xl shadow-xl hover:bg-gold-500 transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};
