import { useRef, useEffect, useCallback, useState } from 'react';
import { generateWords } from '../utils/words';
import { generateQuote } from '../utils/quotes';

export const useTypingEngine = (status, startTest, endTest, resetTest, mode, config, includePunctuation, includeNumbers, confidenceMode) => {
    // Config-dependent word generation - initialize with empty array to avoid hydration mismatch
    const [words, setWords] = useState([]);

    // Initialize words on mount (client-side only)
    useEffect(() => {
        if (mode === 'quote') {
            const lengthType = typeof config === 'string' ? config : 'medium';
            setWords(generateQuote(lengthType));
        } else {
            const count = mode === 'time' ? 300 : config;
            setWords(generateWords(count, includePunctuation, includeNumbers));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Re-generate words when config changes (only if idle)
    useEffect(() => {
        if (status === 'idle') {
            if (mode === 'quote') {
                // For Quotes mode, config is a string: 'short', 'medium', or 'long'
                const lengthType = typeof config === 'string' ? config : 'medium';
                setWords(generateQuote(lengthType));
            } else {
                const count = mode === 'time' ? 300 : config;

                // Load Weak Keys for Adaptive Generation
                let weakKeys = [];
                try {
                    const savedStats = JSON.parse(localStorage.getItem('rapidkeys_keystats') || '{}');
                    weakKeys = Object.entries(savedStats)
                        .filter(([_, stats]) => {
                            const acc = stats.total > 0 ? (stats.total - stats.errors) / stats.total : 1;
                            return acc < 0.85 && stats.total > 5;
                        })
                        .map(([char]) => char);
                } catch (e) {
                    console.error("Failed to load weak keys", e);
                }

                setWords(generateWords(count, includePunctuation, includeNumbers, weakKeys));
            }
        }
    }, [mode, config, includePunctuation, includeNumbers, status]);

    const cursor = useRef({ wordIndex: 0, charIndex: 0 });
    const stats = useRef({ correct: 0, incorrect: 0, extra: 0, totalKeystrokes: 0 });
    const sessionKeys = useRef(new Map());
    const charRefs = useRef(new Map());
    const charStates = useRef({});  // wordIdx -> { charIdx: 'correct'|'incorrect' }

    // Imperative extras tracking - no React state, just refs and DOM
    const extrasContainers = useRef(new Map()); // wordIdx -> container element
    const extrasData = useRef({}); // wordIdx -> array of extra chars

    // Flag to prevent double-processing: keydown handles desktop, input handles mobile
    const keydownHandled = useRef(false);

    const registerRef = useCallback((wordIdx, charIdx, node) => {
        if (node) {
            charRefs.current.set(`${wordIdx}-${charIdx}`, node);
        } else {
            charRefs.current.delete(`${wordIdx}-${charIdx}`);
        }
    }, []);

    const registerExtrasContainer = useCallback((wordIdx, node) => {
        if (node) {
            extrasContainers.current.set(wordIdx, node);
        } else {
            extrasContainers.current.delete(wordIdx);
        }
    }, []);

    // Imperatively add an extra character to the DOM (max 15 extras per word)
    const MAX_EXTRAS = 15;

    const addExtraChar = useCallback((wordIdx, char) => {
        const container = extrasContainers.current.get(wordIdx);
        if (!container) return false;

        // Track in data
        if (!extrasData.current[wordIdx]) {
            extrasData.current[wordIdx] = [];
        }

        // Limit to 15 extra characters per word
        if (extrasData.current[wordIdx].length >= MAX_EXTRAS) {
            return false; // Don't add more extras
        }

        const extraIndex = extrasData.current[wordIdx].length;
        extrasData.current[wordIdx].push(char);

        // Create DOM element
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'inline-block relative text-extra';
        span.dataset.extraIdx = extraIndex;

        // Register the ref for caret positioning
        const refKey = `${wordIdx}-${words[wordIdx].chars.length + extraIndex}`;
        charRefs.current.set(refKey, span);

        container.appendChild(span);
        return true;
    }, [words]);

    // Imperatively remove the last extra character
    const removeExtraChar = useCallback((wordIdx) => {
        const container = extrasContainers.current.get(wordIdx);
        if (!container || !extrasData.current[wordIdx]?.length) return false;

        // Remove from data
        extrasData.current[wordIdx].pop();
        const extraIndex = extrasData.current[wordIdx].length;

        // Remove DOM element
        if (container.lastChild) {
            container.removeChild(container.lastChild);
        }

        // Unregister the ref
        const refKey = `${wordIdx}-${words[wordIdx].chars.length + extraIndex}`;
        charRefs.current.delete(refKey);

        return true;
    }, [words]);

    const resetEngine = useCallback(() => {
        // Reset character classes
        charRefs.current.forEach((node, key) => {
            // Only reset original word characters, not extras
            if (!key.includes('extra')) {
                node.className = 'inline-block relative transition-colors duration-100 ease-out text-[var(--color-text-secondary)] border-b-2 border-transparent';
            }
        });

        // Clear all extras from DOM
        extrasContainers.current.forEach((container) => {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        });
        extrasData.current = {};

        cursor.current = { wordIndex: 0, charIndex: 0 };
        stats.current = { correct: 0, incorrect: 0, extra: 0, totalKeystrokes: 0 };
        sessionKeys.current.clear();
        charStates.current = {};

        // Refresh words with weak keys for adaptive generation
        if (mode === 'quote') {
            // For Quotes mode, config is a string: 'short', 'medium', or 'long'
            const lengthType = typeof config === 'string' ? config : 'medium';
            setWords(generateQuote(lengthType));
        } else {
            const count = mode === 'time' ? 300 : config;
            let weakKeys = [];
            try {
                const savedStats = JSON.parse(localStorage.getItem('rapidkeys_keystats') || '{}');
                weakKeys = Object.entries(savedStats)
                    .filter(([_, stats]) => {
                        const acc = stats.total > 0 ? (stats.total - stats.errors) / stats.total : 1;
                        return acc < 0.85 && stats.total > 5;
                    })
                    .map(([char]) => char);
            } catch { }

            setWords(generateWords(count, includePunctuation, includeNumbers, weakKeys));
        }

        window.dispatchEvent(new CustomEvent('caret-reset'));
    }, [mode, config, includePunctuation, includeNumbers]);

    // Input Handler for Mobile/Hidden Input
    const handleInput = useCallback((e) => {
        if (status === 'finished' || status === 'paused') return;

        const inputType = e.nativeEvent?.inputType;
        const data = e.nativeEvent?.data;

        // Auto-start on first input
        if (status === 'idle') {
            startTest();
        }

        // Handle Backspace (Android/Mobile often sends specific inputType)
        if (inputType === 'deleteContentBackward') {
            // Skip if keydown already handled this keystroke (desktop browsers)
            if (keydownHandled.current) {
                keydownHandled.current = false;
                return;
            }
            const wordIdx = cursor.current.wordIndex;
            const currentWordObj = words[wordIdx];
            if (!currentWordObj) return;
            const currentWordChars = currentWordObj.chars;

            if (cursor.current.charIndex > 0) {
                // Check if we're deleting an extra character
                if (cursor.current.charIndex > currentWordChars.length) {
                    removeExtraChar(wordIdx);
                    cursor.current.charIndex--;
                } else {
                    cursor.current.charIndex--;
                    const node = charRefs.current.get(`${wordIdx}-${cursor.current.charIndex}`);
                    if (node) {
                        node.classList.remove('text-correct', 'text-incorrect');
                    }
                }
                stats.current.totalKeystrokes++;
                window.dispatchEvent(new CustomEvent('cursor-move', { detail: cursor.current }));
            } else if (wordIdx > 0) {
                // At start of word, go back to previous word
                cursor.current.wordIndex--;
                const prevWordObj = words[cursor.current.wordIndex];
                const prevExtras = extrasData.current[cursor.current.wordIndex] || [];
                // Position cursor at end of previous word (including any extras)
                cursor.current.charIndex = prevWordObj.chars.length + prevExtras.length;
                stats.current.totalKeystrokes++;
                window.dispatchEvent(new CustomEvent('cursor-move', { detail: cursor.current }));
            }
            return;
        }

        // Handle Text Insert
        if (inputType === 'insertText' && data) {
            // Skip if keydown already handled this keystroke (desktop browsers)
            if (keydownHandled.current) {
                keydownHandled.current = false;
                return;
            }
            // Process the last character of data (mobile/IME only reaches here)
            const char = data.slice(-1);
            processChar(char);
        }

    }, [status, words, startTest, removeExtraChar]); // processChar will be defined inside or memoized

    // Extracted Char Processing Logic to share between KeyDown and Input
    const processChar = useCallback((key) => {
        const currentWordObj = words[cursor.current.wordIndex];
        if (!currentWordObj) return;

        const currentWordChars = currentWordObj.chars;
        const wordIdx = cursor.current.wordIndex;

        stats.current.totalKeystrokes++;

        // TYPING LOGIC
        if (cursor.current.charIndex < currentWordChars.length) {
            // Still within the word
            const targetChar = currentWordChars[cursor.current.charIndex];
            const charKey = `${wordIdx}-${cursor.current.charIndex}`;
            const node = charRefs.current.get(charKey);

            // TRACK KEY STATS
            if (!sessionKeys.current.has(targetChar)) {
                sessionKeys.current.set(targetChar, { total: 0, errors: 0 });
            }
            const charStat = sessionKeys.current.get(targetChar);
            charStat.total++;

            // TRACK CHAR STATE for replay
            if (!charStates.current[wordIdx]) charStates.current[wordIdx] = {};

            if (key === targetChar) {
                if (node) node.classList.add('text-correct');
                stats.current.correct++;
                charStates.current[wordIdx][cursor.current.charIndex] = 'correct';
            } else {
                if (!confidenceMode) {
                    if (node) node.classList.add('text-incorrect');
                }
                stats.current.incorrect++;
                charStat.errors++;
                charStates.current[wordIdx][cursor.current.charIndex] = 'incorrect';

                // Dispatch typing error sound event
                window.dispatchEvent(new CustomEvent('typing-error'));
            }
            cursor.current.charIndex++;
        } else if (key === ' ') {
            // Next Word - space pressed after word is complete
            cursor.current.wordIndex++;
            cursor.current.charIndex = 0;

            // Dispatch word complete sound event
            window.dispatchEvent(new CustomEvent('word-complete'));

            if (mode === 'words' && cursor.current.wordIndex >= config) {
                // Dispatch test complete sound before ending
                window.dispatchEvent(new CustomEvent('test-complete'));
                endTest();
                return;
            }
        } else {
            // Extra character beyond word length
            const added = addExtraChar(wordIdx, key);
            if (added) {
                cursor.current.charIndex++;
                stats.current.extra++;
                stats.current.incorrect++;

                // Extra chars are also errors
                window.dispatchEvent(new CustomEvent('typing-error'));
            }
        }

        // Dispatch stats update
        window.dispatchEvent(new CustomEvent('stats-update', {
            detail: {
                correct: stats.current.correct,
                totalKeystrokes: stats.current.totalKeystrokes
            }
        }));
        window.dispatchEvent(new CustomEvent('cursor-move', { detail: cursor.current }));

        // Dispatch typing sound event (picked up by useTypingSound hook)
        window.dispatchEvent(new CustomEvent('typing-sound'));
    }, [words, mode, config, confidenceMode, endTest, addExtraChar]);


    const handleKeyDown = useCallback((e) => {
        // Handle Escape - Instant Restart
        if (e.key === 'Escape') {
            e.preventDefault();
            resetTest();
            resetEngine();
            return;
        }

        if (status === 'finished' || status === 'paused') return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // IGNORE MOBILE/IME 'Unidentified' keys - let handleInput pick them up
        if (e.key === 'Unidentified' || e.key === 'Process' || e.keyCode === 229) {
            return;
        }

        // Auto-start
        if (status === 'idle' && e.key.length === 1) {
            startTest();
        }

        const { key } = e;
        const currentWordObj = words[cursor.current.wordIndex];

        if (!currentWordObj) return;

        const currentWordChars = currentWordObj.chars;
        const wordIdx = cursor.current.wordIndex;

        // Handle Backspace
        if (key === 'Backspace') {
            keydownHandled.current = true;
            if (cursor.current.charIndex > 0) {
                // Check if we're deleting an extra character
                if (cursor.current.charIndex > currentWordChars.length) {
                    removeExtraChar(wordIdx);
                    cursor.current.charIndex--;
                } else {
                    cursor.current.charIndex--;
                    const node = charRefs.current.get(`${wordIdx}-${cursor.current.charIndex}`);
                    if (node) {
                        node.classList.remove('text-correct', 'text-incorrect');
                    }
                }
                stats.current.totalKeystrokes++;
                window.dispatchEvent(new CustomEvent('cursor-move', { detail: cursor.current }));
            } else if (wordIdx > 0) {
                // At start of word, go back to previous word
                cursor.current.wordIndex--;
                const prevWordObj = words[cursor.current.wordIndex];
                const prevExtras = extrasData.current[cursor.current.wordIndex] || [];
                // Position cursor at end of previous word (including any extras)
                cursor.current.charIndex = prevWordObj.chars.length + prevExtras.length;
                stats.current.totalKeystrokes++;
                window.dispatchEvent(new CustomEvent('cursor-move', { detail: cursor.current }));
            }
            // Reset flag after a short delay
            setTimeout(() => { keydownHandled.current = false; }, 10);
            return;
        }

        // Process single character keys
        if (key.length === 1) {
            keydownHandled.current = true;
            processChar(key);
            // Reset flag after a short delay to be ready for the next keystroke
            setTimeout(() => { keydownHandled.current = false; }, 10);
        }

    }, [status, words, startTest, resetTest, resetEngine, removeExtraChar, processChar]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Build typed words with states for replay
    const getTypedWords = useCallback(() => {
        return words.slice(0, cursor.current.wordIndex + 1).map((word, wordIdx) => ({
            ...word,
            charStates: word.chars.map((_, charIdx) => charStates.current[wordIdx]?.[charIdx] || 'untyped'),
            extras: extrasData.current[wordIdx] || []
        }));
    }, [words]);

    return {
        words,
        resetEngine,
        registerRef,
        registerExtrasContainer,
        cursor: cursor.current,
        stats: stats.current,
        charRefs,
        sessionKeys: sessionKeys.current,
        getTypedWords,
        handleInput // Export handleInput
    };
};
