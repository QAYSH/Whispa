import { Lock } from 'lucide-react';

export function EncryptedBadge() {
    return (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <Lock className="w-3 h-3" />
            <span>End-to-end encrypted</span>
    </div>
);
}