import React, { memo, useRef, useEffect } from 'react';

const Letter = memo(({ char, wordIdx, charIdx, registerRef }) => {
    return (
        <span
            ref={(el) => registerRef(wordIdx, charIdx, el)}
            className="inline-block relative transition-colors duration-100 ease-out text-[var(--color-text-secondary)] border-b-2 border-transparent"
            data-char={char}
        >
            {char}
        </span>
    );
});

Letter.displayName = 'Letter';

export const Word = memo(({ word, wordIdx, registerRef, registerExtrasContainer }) => {
    const extrasRef = useRef(null);

    // Register the extras container ref
    useEffect(() => {
        if (extrasRef.current) {
            registerExtrasContainer(wordIdx, extrasRef.current);
        }
        return () => registerExtrasContainer(wordIdx, null);
    }, [wordIdx, registerExtrasContainer]);

    return (
        <div className="flex mr-3 mb-2 text-2xl font-mono leading-relaxed break-all">
            {word.chars.map((char, charIdx) => (
                <Letter
                    key={`${wordIdx}-${charIdx}`}
                    char={char}
                    wordIdx={wordIdx}
                    charIdx={charIdx}
                    registerRef={registerRef}
                />
            ))}
            {/* Container for extra characters - populated imperatively */}
            <span ref={extrasRef} className="contents" data-extras={wordIdx}></span>
        </div>
    );
});

Word.displayName = 'Word';
