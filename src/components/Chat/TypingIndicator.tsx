import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
    typers: string[];  // Array of user display names who are typing
}

export function TypingIndicator({ typers }: TypingIndicatorProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    if (typers.length === 0) return null;

    let text = '';
    if (typers.length === 1) {
        text = `${typers[0]} is typing`;
    } else if (typers.length === 2) {
        text = `${typers[0]} and ${typers[1]} are typing`;
    } else {
        text = `${typers.length} people are typing`;
    }

    return (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '150ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">
          {text}{dots}
        </span>
            </div>
        </div>
    );
}