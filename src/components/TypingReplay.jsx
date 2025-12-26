import React from 'react';

/**
 * TypingReplay - Subtle evidence-style replay
 * Shows typed text with correct/incorrect highlighting
 */
export const TypingReplay = ({ words }) => {
    if (!words || words.length === 0) return null;

    return (
        <div className="w-full max-w-xl">
            <div className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40 mb-1.5 text-center">
                replay
            </div>
            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 justify-center text-xs font-mono leading-relaxed px-3 py-2 rounded bg-white/[0.02] border border-white/5 max-h-20 overflow-y-auto">
                {words.map((word, wordIdx) => (
                    <span key={word.id || wordIdx} className="inline-flex opacity-80">
                        {word.chars.map((char, charIdx) => {
                            const state = word.charStates?.[charIdx] || 'untyped';

                            let colorClass = 'text-text-secondary opacity-30';
                            if (state === 'correct') colorClass = 'text-text-primary opacity-70';
                            if (state === 'incorrect') colorClass = 'text-red-400';

                            return (
                                <span key={charIdx} className={colorClass}>
                                    {char}
                                </span>
                            );
                        })}
                        {word.extras?.map((extra, i) => (
                            <span key={`extra-${i}`} className="text-orange-400 opacity-70">
                                {extra}
                            </span>
                        ))}
                    </span>
                ))}
            </div>
        </div>
    );
};
