import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';
import { Send, Image as ImageIcon, Trash2, Key, Bot, User, Loader2, BarChart2, X, Terminal } from 'lucide-react';

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

// Grok API Configuration
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-beta'; // or 'grok-2-latest' if available

export const AIAnalyst: React.FC<AIAnalystProps> = ({ trades }) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('mr_wick_xai_api_key') || '');
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('mr_wick_grok_history');
        // If we have legacy gemini history (role: 'model'), we might want to clear it or map it. 
        // For safety, let's start fresh if the roles don't match standard OpenAI format.
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0 && (parsed[0].role === 'model' || !parsed[0].role)) {
                    return getIntroMessage();
                }
                return parsed;
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
            content: "I am Mr. Wick. Powered by Grok. I'm here to analyze your trades, review your charts, and sharpen your edge. Send me a chart or ask me to review your journal."
        }];
    }

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Persist Data
    useEffect(() => {
        localStorage.setItem('mr_wick_xai_api_key', apiKey);
    }, [apiKey]);

    useEffect(() => {
        localStorage.setItem('mr_wick_grok_history', JSON.stringify(messages));
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
            setMessages([{
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Memory wiped. We start fresh. What do you need?"
            }]);
            localStorage.removeItem('mr_wick_grok_history');
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

        try {
            // 2. Prepare Payload for xAI (OpenAI compatible)
            const systemMessage = {
                role: "system",
                content: "You are 'Mr. Wick', a professional, disciplined, and slightly intense trading mentor. You focus on risk management, psychology, and price action. Keep answers concise, actionable, and stern but helpful. You are powered by Grok AI."
            };

            const apiMessages = [systemMessage, ...newHistory.filter(m => !m.isError && m.id !== 'intro').map(m => {
                // Handle Image Content for Vision Model
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
            const response = await fetch(GROK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: GROK_MODEL,
                    messages: apiMessages,
                    stream: true, // We will handle simple streaming
                    temperature: 0.7
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
                content: `I encountered an error connecting to Grok. Check your API Key. (${error.message})`,
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
        
        // Prepare a summary to save context window
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
                    <div className="bg-slate-900 dark:bg-white p-2 rounded-lg">
                        {/* Grok-style icon representation */}
                        <Terminal className="h-6 w-6 text-white dark:text-slate-900" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Mr. Wick
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">GROK</span>
                        </h2>
                        <p className="text-xs text-green-500 font-medium flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Online
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
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">xAI (Grok) API Key Required</label>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-500 outline-none"
                            placeholder="xai-..."
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
                                {msg.role === 'user' ? <User className="h-5 w-5 text-slate-500 dark:text-slate-400" /> : <Bot className="h-5 w-5 text-white dark:text-slate-900" />}
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
                            placeholder="Ask Mr. Wick (Grok)..."
                            className="w-full h-full bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none transition-all"
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
