import React from 'react';

const ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

export const VisualKeyboard = ({ sessionKeys }) => {
    const getKeyColor = (char) => {
        if (!sessionKeys || !sessionKeys.has(char)) return 'bg-white/5 border-white/10 text-white/30';

        const stats = sessionKeys.get(char);
        if (!stats || stats.total === 0) return 'bg-white/5 border-white/10 text-white/30';

        const errorRate = stats.errors / stats.total;

        if (errorRate === 0) {
            return 'bg-green-500/30 border-green-500/60 text-green-300';
        } else if (errorRate < 0.2) {
            return 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300';
        } else {
            return 'bg-red-500/30 border-red-500/60 text-red-300';
        }
    };

    return (
        <div className="flex flex-col gap-1 items-center select-none">
            <div className="text-[10px] uppercase font-bold tracking-widest text-text-secondary opacity-50 mb-1">Error Heatmap</div>

            {ROWS.map((row, i) => (
                <div key={i} className="flex gap-1" style={{ marginLeft: i === 1 ? '12px' : i === 2 ? '24px' : 0 }}>
                    {row.map((char) => (
                        <div
                            key={char}
                            className={`flex items-center justify-center w-7 h-7 rounded border text-xs font-bold uppercase ${getKeyColor(char)}`}
                            title={sessionKeys?.get(char) ? `${char.toUpperCase()}: ${Math.round((1 - sessionKeys.get(char).errors / sessionKeys.get(char).total) * 100)}%` : ''}
                        >
                            {char}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
