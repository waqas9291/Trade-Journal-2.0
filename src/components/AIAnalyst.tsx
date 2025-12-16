import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { Send, Image as ImageIcon, Trash2, Key, Zap, User, Loader2, BarChart2, X, ExternalLink } from 'lucide-react';

interface AIAnalystProps {
    trades: Trade[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    image?: string;
    isError?: boolean;
}

// Grok (LPU) API Configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_TEXT = 'llama-3.3-70b-versatile'; // High intelligence for text
const MODEL_VISION = 'llama-3.2-90b-vision-preview'; // For analyzing charts

export const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('mr_wick_groq_api_key') || '');
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('mr_wick_groq_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure legacy formats don't break the app
                if (parsed.length > 0 && parsed[0].content) {
                    return parsed;
                }
                return getIntroMessage();
            } catch (e) {
                return getIntroMessage();
            }
        }
        return getIntroMessage();
    });
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(!apiKey);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    function getIntroMessage(): Message[] {
        return [{
            id: 'intro',
            role: 'assistant',
            content: "I am Mr. Wick. I run on Llama 3 via Groq (Free & Fast). Send me your charts or trading logs. I don't sugarcoat, I just help you execute."
        }];
    }

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Persist Data
    useEffect(() => {
        localStorage.setItem('mr_wick_groq_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem('mr_wick_groq_history', JSON.stringify(messages));
    }, [messages]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearChat = () => {
        if(window.confirm("Clear chat history?")) {
            setMessages(getIntroMessage());
            localStorage.removeItem('mr_wick_groq_history');
        }
    };

    const sendMessage = async (overrideText?: string, hiddenContext?: string) => {
        const textToSend = overrideText || input;
        if ((!textToSend && !selectedImage) || !apiKey) return;

        // 1. Prepare User Message
        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: textToSend,
            image: selectedImage || undefined
        };

        const newHistory = [...messages, newMessage];
        setMessages(newHistory);
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        // Determine if we need vision model or text model
        // If the current message has an image, we MUST use the vision model
        // Groq vision models have smaller context windows usually, so be careful
        const hasImage = !!newMessage.image;
        const activeModel = hasImage ? MODEL_VISION : MODEL_TEXT;

        try {
            // 2. Prepare Payload for Groq (OpenAI compatible)
            const systemMessage = {
                role: "system",
                content: "You are 'Mr. Wick', a professional, disciplined, and slightly intense trading mentor. You focus on risk management, psychology, and price action. Keep answers concise, actionable, and stern but helpful."
            };

            const apiMessages = [systemMessage, ...newHistory.filter(m => !m.isError && m.id !== 'intro').map(m => {
                // Handle Image Content
                if (m.image) {
                    return {
                        role: m.role,
                        content: [
                            { type: "text", text: m.content },
                            { type: "image_url", image_url: { url: m.image } }
                        ]
                    };
                }
                // Handle Hidden Context (e.g. Journal Data)
                if (m.id === newMessage.id && hiddenContext) {
                     return {
                        role: m.role,
                        content: `${m.content}\n\n[SYSTEM DATA CONTEXT]: ${hiddenContext}`
                    };
                }
                return {
                    role: m.role,
                    content: m.content
                };
            })];

            // 3. Fetch Request
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: activeModel,
                    messages: apiMessages,
                    stream: true, 
                    temperature: 0.6,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API Error: ${response.status}`);
            }

            if (!response.body) throw new Error("No response body");

            // 4. Handle Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const botMessageId = crypto.randomUUID();
            let fullContent = "";

            setMessages(prev => [...prev, {
                id: botMessageId,
                role: 'assistant',
                content: ""
            }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const contentDelta = data.choices[0]?.delta?.content || "";
                            fullContent += contentDelta;
                            
                            setMessages(prev => prev.map(m => 
                                m.id === botMessageId ? { ...m, content: fullContent } : m
                            ));
                        } catch (e) {
                            console.warn("Error parsing stream chunk", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `I encountered an error connecting to Groq. Check your API Key. (${error.message})`,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeJournal = () => {
        if (trades.length === 0) {
            alert("No trades to analyze.");
            return;
        }
        
        // Prepare a summary
        const summary = trades.slice(0, 50).map(t => ({
            date: t.entryDate,
            symbol: t.symbol,
            type: t.direction,
            pnl: t.pnl,
            notes: t.notes
        }));

        sendMessage(
            "Analyze my recent trading performance based on the data I'm providing. Find my leaks.",
            JSON.stringify(summary)
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                        <Zap className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Mr. Wick
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-mono">GROQ-LPU</span>
                        </h2>
                        <p className="text-xs text-green-500 font-medium flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Online (Llama 3.3)
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className={`p-2 rounded-lg transition-colors ${!apiKey ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 animate-pulse' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        title="API Key Settings"
                    >
                        <Key className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={clearChat}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Clear History"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* API Key Banner */}
            {showKeyInput && (
                <div className="p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 shrink-0 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Groq API Key (Free)</label>
                        <a 
                            href="https://console.groq.com/keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center"
                        >
                            Get Key Here <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="gsk_..."
                        />
                        <button 
                            onClick={() => setShowKeyInput(false)}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 mx-2 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-900 dark:bg-white'}`}>
                                {msg.role === 'user' ? <User className="h-5 w-5 text-slate-500 dark:text-slate-400" /> : <Zap className="h-5 w-5 text-white dark:text-slate-900" />}
                            </div>
                            
                            {/* Bubble */}
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                            }`}>
                                {msg.image && (
                                    <img src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-3 border border-white/20" />
                                )}
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                     {msg.content.split('\n').map((line, i) => (
                                         <p key={i} className="min-h-[1.2em] mb-1 last:mb-0">
                                            {line.startsWith('**') ? <strong className={msg.role === 'assistant' ? "text-slate-900 dark:text-white" : ""}>{line.replace(/\*\*/g, '')}</strong> : line.replace(/\*\*/g, '')}
                                         </p>
                                     ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                {selectedImage && (
                    <div className="mb-3 inline-flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <ImageIcon className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Image attached</span>
                        <button onClick={() => setSelectedImage(null)} className="ml-2 text-rose-500 hover:text-rose-600"><X className="h-3 w-3" /></button>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button 
                        onClick={analyzeJournal}
                        className="hidden md:flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                        title="Analyze My Journal Data"
                    >
                        <BarChart2 className="h-5 w-5" />
                    </button>
                    
                    <label className="flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-colors">
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        <ImageIcon className="h-5 w-5" />
                    </label>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                            placeholder="Ask Mr. Wick (Groq)..."
                            className="w-full h-full bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>
                    
                    <button 
                        onClick={() => sendMessage()}
                        disabled={isLoading || (!input && !selectedImage)}
                        className="p-3 bg-slate-900 dark:bg-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-900 rounded-xl shadow-lg transition-all transform active:scale-95"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
