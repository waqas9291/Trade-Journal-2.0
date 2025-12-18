import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Send, Zap, User, Loader2, Target, AlertTriangle } from 'lucide-react';

interface AIAnalystProps {
    trades: Trade[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const SYSTEM_INSTRUCTION = `You are 'Mr. Wick', a legendary, disciplined, and high-stakes trading floor mentor for MR Wick Trades. 
    YOUR MISSION: Provide institutional-grade trade insights and professional strategy signals.
    
    EXPERT KNOWLEDGE: You are a master of ICT (Inner Circle Trader) concepts and SMC (Smart Money Concepts), including Order Blocks, Fair Value Gaps (FVG), and Liquidity sweeps.
    
    DATA CONTEXT: You have access to the user's trade journal. 
    - Be decisive. Provide specific entry, stop loss, and profit targets when requested.
    - Maintain a stern, actionable, and elite professional tone.
    - Call out strategy leaks if the user is showing poor risk management or over-trading.`;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input) return;
        const userMsg = { id: crypto.randomUUID(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: `${input}\n\nJournal context: ${JSON.stringify(trades.slice(0, 15))}` }] }],
                config: { systemInstruction: SYSTEM_INSTRUCTION }
            });

            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response.text || '' }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "Lost contact with Mr. Wick. Verify your API Key.", isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Zap className="h-6 w-6 text-gold-500" />
                    <h2 className="font-bold text-white uppercase italic tracking-tighter">Mr. Wick Signal Terminal</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-700 flex gap-2">
                <input 
                    type="text" value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Mr. Wick for a signal or performance review..." 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-gold-500 outline-none" 
                />
                <button onClick={sendMessage} disabled={isLoading} className="p-3 bg-gold-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};