import { Check, CheckCheck, Lock, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageBubbleProps {
    text: string;
    isOwn: boolean;
    timestamp: string;
    status?: MessageStatus;
    isEncrypted?: boolean;
}

export function MessageBubble({
                                  text,
                                  isOwn,
                                  timestamp,
                                  status = 'sent',
                                  isEncrypted = true
                              }: MessageBubbleProps) {

    const getStatusIcon = () => {
        switch (status) {
            case 'sending':
                return <Clock className="w-3 h-3 animate-pulse" />;
            case 'sent':
                return <Check className="w-3 h-3" />;
            case 'delivered':
                return <CheckCheck className="w-3 h-3" />;
            case 'read':
                return <CheckCheck className="w-3 h-3 text-cyan-400" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'sending': return 'Sending...';
            case 'sent': return 'Sent';
            case 'delivered': return 'Delivered';
            case 'read': return 'Read';
            default: return '';
        }
    };

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}>
            <div className={`relative max-w-[75%] ${isOwn ? 'ml-12' : 'mr-12'}`}>
                <div className={isOwn ? 'bubble-own' : 'bubble-other'}>
                    <div className="px-4 py-2.5">
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {text}
                        </p>

                        {/* Timestamp & Status */}
                        <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${
                            isOwn ? 'text-white/50' : 'text-[var(--text-muted)]'
                        }`}>
                            {isEncrypted && <Lock className="w-2.5 h-2.5" />}
                            <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>

                            {isOwn && (
                                <div className="flex items-center gap-0.5 ml-0.5" title={getStatusText()}>
                                    {getStatusIcon()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}