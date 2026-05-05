import { useState } from 'react';
import { Send, Lock } from 'lucide-react';

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSend(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={disabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                    />
                    <div className="absolute right-3 top-2.5">
                        <Lock className="w-4 h-4 text-green-500" />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </form>
    );
}