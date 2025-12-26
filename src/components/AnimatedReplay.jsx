import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AnimatedReplay - Video-like typing replay
 * Full keyboard layout matching real keyboard
 */

const KEYBOARD_LAYOUT = [
    { keys: ['~\n`', '!\n1', '@\n2', '#\n3', '$\n4', '%\n5', '^\n6', '&\n7', '*\n8', '(\n9', ')\n0', '_\n-', '+\n='], special: [{ key: 'Backspace', width: 'w-16' }] },
    { special: [{ key: 'Tab', width: 'w-12' }], keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{\n[', '}\n]', '|\n\\'] },
    { special: [{ key: 'Caps Lock', width: 'w-14' }], keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':\n;', '"\n\''], specialEnd: [{ key: 'Enter', width: 'w-16' }] },
    { special: [{ key: 'Shift', width: 'w-16' }], keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<\n,', '>\n.', '?\n/'], specialEnd: [{ key: 'Shift', width: 'w-16' }] },
    { special: [{ key: 'Ctrl', width: 'w-10' }, { key: 'Alt', width: 'w-10' }], keys: [], specialEnd: [{ key: 'Alt', width: 'w-10' }, { key: 'Ctrl', width: 'w-10' }] }
];

export const AnimatedReplay = ({ typedWords }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const [currentCharIdx, setCurrentCharIdx] = useState(0);
    const [activeKey, setActiveKey] = useState(null);
    const timeoutRef = useRef(null);

    // Total characters for progress
    const totalChars = React.useMemo(() => {
        return typedWords.reduce((sum, word) => sum + word.chars.length + 1, 0) - 1;
    }, [typedWords]);

    const currentProgress = React.useMemo(() => {
        let count = 0;
        for (let w = 0; w < currentWordIdx; w++) {
            count += typedWords[w].chars.length + 1;
        }
        count += currentCharIdx;
        return count;
    }, [typedWords, currentWordIdx, currentCharIdx]);

    const play = useCallback(() => {
        if (currentWordIdx >= typedWords.length) {
            setCurrentWordIdx(0);
            setCurrentCharIdx(0);
        }
        setIsPlaying(true);
    }, [currentWordIdx, typedWords.length]);

    const pause = useCallback(() => {
        setIsPlaying(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const reset = useCallback(() => {
        pause();
        setCurrentWordIdx(0);
        setCurrentCharIdx(0);
        setActiveKey(null);
    }, [pause]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying) return;

        const currentWord = typedWords[currentWordIdx];
        if (!currentWord) {
            setIsPlaying(false);
            setActiveKey(null);
            return;
        }

        // Get current character
        if (currentCharIdx < currentWord.chars.length) {
            const char = currentWord.chars[currentCharIdx].toLowerCase();
            setActiveKey(char);

            timeoutRef.current = setTimeout(() => {
                setCurrentCharIdx(prev => prev + 1);
            }, 70);
        } else {
            // Move to next word (space press)
            setActiveKey(' ');
            timeoutRef.current = setTimeout(() => {
                setCurrentWordIdx(prev => prev + 1);
                setCurrentCharIdx(0);
            }, 70);
        }

        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [isPlaying, currentWordIdx, currentCharIdx, typedWords]);

    // Clear active key highlight
    useEffect(() => {
        if (activeKey) {
            const timer = setTimeout(() => setActiveKey(null), 50);
            return () => clearTimeout(timer);
        }
    }, [activeKey, currentProgress]);

    const getKeyClass = (key) => {
        const isActive = activeKey === key;

        if (isActive && currentWordIdx < typedWords.length) {
            // Get the current character state
            const currentWord = typedWords[currentWordIdx];
            const state = currentWord.charStates?.[currentCharIdx];

            // Color based on correctness
            if (state === 'correct') {
                return 'bg-green-500 text-white scale-95 shadow-[0_0_12px_rgb(34,197,94)]';
            } else if (state === 'incorrect') {
                return 'bg-red-500 text-white scale-95 shadow-[0_0_12px_rgb(239,68,68)]';
            }
            // Default yellow for space or other
            return 'bg-[var(--color-caret)] text-[var(--color-bg-primary)] scale-95 shadow-[0_0_12px_var(--color-caret)]';
        }
        return 'bg-white/5 text-white/40';
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">

            {/* Typing Test Style Display */}
            <div className="w-full text-center">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-2xl font-mono leading-relaxed">
                    {typedWords.map((word, wordIdx) => {
                        const isCurrentWord = wordIdx === currentWordIdx;
                        const isPastWord = wordIdx < currentWordIdx;
                        const isFutureWord = wordIdx > currentWordIdx;

                        return (
                            <span key={word.id || wordIdx} className="inline-flex relative">
                                {word.chars.map((char, charIdx) => {
                                    let colorClass = 'text-text-secondary opacity-40'; // future/untyped

                                    if (isPastWord) {
                                        // Past word - show state
                                        const state = word.charStates?.[charIdx] || 'correct';
                                        colorClass = state === 'correct' ? 'text-text-primary' : 'text-red-400';
                                    } else if (isCurrentWord) {
                                        if (charIdx < currentCharIdx) {
                                            // Already typed in current word
                                            const state = word.charStates?.[charIdx] || 'correct';
                                            colorClass = state === 'correct' ? 'text-text-primary' : 'text-red-400';
                                        } else if (charIdx === currentCharIdx) {
                                            // Current character (with caret)
                                            colorClass = 'text-text-secondary opacity-60';
                                        }
                                    }

                                    return (
                                        <span key={charIdx} className={`relative ${colorClass}`}>
                                            {/* Caret */}
                                            {isCurrentWord && charIdx === currentCharIdx && (
                                                <span className="absolute -left-[2px] top-0 w-[3px] h-full bg-[var(--color-caret)] animate-pulse rounded-sm" />
                                            )}
                                            {char}
                                        </span>
                                    );
                                })}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Full Keyboard Layout */}
            <div className="flex flex-col gap-1 items-center select-none mt-2 scale-75 sm:scale-90 md:scale-100">
                {KEYBOARD_LAYOUT.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-1">
                        {/* Left special keys */}
                        {row.special?.map((spec, i) => (
                            <div key={`spec-${i}`} className={`flex items-center justify-center ${spec.width} h-7 rounded bg-white/5 text-white/40 border border-white/10 text-[9px] font-medium px-1`}>
                                {spec.key}
                            </div>
                        ))}

                        {/* Regular keys */}
                        {row.keys.map((key, i) => {
                            const displayKey = key.includes('\n') ? key.split('\n')[1] : key;
                            const lowerKey = displayKey.toLowerCase();
                            const isActive = activeKey === lowerKey || activeKey === displayKey;

                            return (
                                <div
                                    key={i}
                                    className={`flex items-center justify-center w-7 h-7 rounded border border-white/10 text-[10px] font-bold transition-all duration-75 ${isActive && currentWordIdx < typedWords.length
                                            ? typedWords[currentWordIdx].charStates?.[currentCharIdx] === 'correct'
                                                ? 'bg-green-500 text-white scale-95 shadow-[0_0_12px_rgb(34,197,94)]'
                                                : typedWords[currentWordIdx].charStates?.[currentCharIdx] === 'incorrect'
                                                    ? 'bg-red-500 text-white scale-95 shadow-[0_0_12px_rgb(239,68,68)]'
                                                    : 'bg-[var(--color-caret)] text-[var(--color-bg-primary)] scale-95 shadow-[0_0_12px_var(--color-caret)]'
                                            : 'bg-white/5 text-white/40'
                                        }`}
                                >
                                    {displayKey}
                                </div>
                            );
                        })}

                        {/* Right special keys */}
                        {row.specialEnd?.map((spec, i) => (
                            <div key={`spec-end-${i}`} className={`flex items-center justify-center ${spec.width} h-7 rounded bg-white/5 text-white/40 border border-white/10 text-[9px] font-medium px-1`}>
                                {spec.key}
                            </div>
                        ))}

                        {/* Spacebar on last row */}
                        {rowIdx === 4 && (
                            <div className={`w-64 h-7 rounded border border-white/10 transition-all duration-75 ${activeKey === ' ' ? 'bg-[var(--color-caret)] scale-95' : 'bg-white/5'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                <button
                    onClick={isPlaying ? pause : play}
                    className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                    onClick={reset}
                    className="px-3 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                >
                    ↺ Reset
                </button>
            </div>
        </div>
    );
};
