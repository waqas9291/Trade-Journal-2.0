import React from 'react';
import { Trade } from '../types';
import { BrainCircuit } from 'lucide-react';

interface AIAnalystProps {
    trades: Trade[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 dark:text-slate-400">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                <BrainCircuit className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Analyst Disabled</h2>
            <p className="text-center max-w-md">
                The AI features are currently disabled for maintenance. 
                They will be re-enabled in a future update.
            </p>
        </div>
    );
};
