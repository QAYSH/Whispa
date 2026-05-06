interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    isOnline?: boolean;
}

const COLORS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-violet-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
    'from-fuchsia-500 to-purple-600',
    'from-lime-500 to-green-600',
];

function getColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
};

export function Avatar({ name, size = 'md', isOnline }: AvatarProps) {
    const color = getColorFromName(name);
    const initials = getInitials(name);

    return (
        <div className="relative flex-shrink-0">
            <div
                className={`${sizeClasses[size]} bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}
            >
                {initials}
            </div>
            {isOnline !== undefined && (
                <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                />
            )}
        </div>
    );
}
