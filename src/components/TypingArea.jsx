import { useRef, useEffect, useState } from 'react';
import { useSystem } from '../hooks/useSystem';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useTypingSound } from '../hooks/useTypingSound';
import { Caret } from './Caret';
import { Word } from './Word';
import { StatsBar } from './StatsBar';
import { Results } from './Results';
import SettingsBar from './SettingsBar';
import SoundSettings from './SoundSettings';

export default function TypingArea() {
    const {
        status,
        startTest,
        endTest,
        resetTest,
        timer,
        mode,
        setMode,
        config,
        setConfig,
        includePunctuation,
        setIncludePunctuation,
        includeNumbers,
        setIncludeNumbers,
        confidenceMode,
        setConfidenceMode,
        // Sound settings
        soundStyle,
        setSoundStyle,
        soundOutput,
        setSoundOutput,
        masterVolume,
        setMasterVolume,
        keyVolume,
        setKeyVolume,
        enableRelease,
        setEnableRelease,
        enableError,
        setEnableError,
        enableWordComplete,
        setEnableWordComplete,
        enableTestComplete,
        setEnableTestComplete,
        enableVariation,
        setEnableVariation,
        variationIntensity,
        setVariationIntensity,
        wpmHistory
    } = useSystem();

    // Sound settings modal state
    const [showSoundSettings, setShowSoundSettings] = useState(false);

    // Build sound settings object for the hook
    const soundSettings = {
        soundStyle,
        soundOutput,
        masterVolume,
        keyVolume,
        enableRelease,
        enableError,
        enableWordComplete,
        enableTestComplete,
        enableVariation,
        variationIntensity
    };

    // Typing sound hook - uses refs to avoid re-renders
    const {
        initAudio,
        playKeyPress,
        previewSound,
        playKeyRelease,
        playError,
        playWordComplete,
        playTestComplete,
        playTestSound,
        updateDeviceTuning
    } = useTypingSound(soundSettings);

    const {
        words,
        resetEngine,
        registerRef,
        registerExtrasContainer,
        charRefs,
        stats,
        sessionKeys,
        getTypedWords,
        handleInput // Destructure handleInput
    } = useTypingEngine(status, startTest, endTest, resetTest, mode, config, includePunctuation, includeNumbers, confidenceMode);

    const [translateY, setTranslateY] = useState(0);
    const containerRef = useRef(null);
    const currentLineTop = useRef(0);
    const inputRef = useRef(null);

    const handleRestart = () => {
        resetTest();
        resetEngine();
        setTranslateY(0);
        currentLineTop.current = 0;
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Focus logic
    useEffect(() => {
        if (status === 'idle') {
            inputRef.current?.focus();
        }
    }, [status]);

    // Initialize audio on first user interaction (browser autoplay policy)
    useEffect(() => {
        const handleFirstInteraction = () => {
            initAudio();
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [initAudio]);

    // Play typing sound on key press
    useEffect(() => {
        const handleKeyPress = () => playKeyPress();
        window.addEventListener('typing-sound', handleKeyPress);
        return () => window.removeEventListener('typing-sound', handleKeyPress);
    }, [playKeyPress]);

    // Play key release sound
    useEffect(() => {
        const handleKeyRelease = () => playKeyRelease();
        window.addEventListener('key-release', handleKeyRelease);
        return () => window.removeEventListener('key-release', handleKeyRelease);
    }, [playKeyRelease]);

    // Play error sound on typing error
    useEffect(() => {
        window.addEventListener('typing-error', playError);
        return () => window.removeEventListener('typing-error', playError);
    }, [playError]);

    // Play word complete sound
    useEffect(() => {
        window.addEventListener('word-complete', playWordComplete);
        return () => window.removeEventListener('word-complete', playWordComplete);
    }, [playWordComplete]);

    // Play test complete sound
    useEffect(() => {
        const handleTestComplete = () => playTestComplete();
        window.addEventListener('test-complete', handleTestComplete);
        return () => window.removeEventListener('test-complete', handleTestComplete);
    }, [playTestComplete]);

    // Update sound buffers when output device changes
    useEffect(() => {
        updateDeviceTuning();
    }, [soundOutput, updateDeviceTuning]);

    // Update Config implies restart
    useEffect(() => {
        handleRestart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, config, includePunctuation, includeNumbers]);

    useEffect(() => {
        const handleCursorMove = (e) => {
            const { wordIndex, charIndex } = e.detail;
            const node = charRefs.current.get(`${wordIndex}-${charIndex}`);

            if (node && containerRef.current) {
                const relativeTop = node.offsetTop;
                if (wordIndex === 0 && charIndex === 0) {
                    currentLineTop.current = relativeTop;
                }

                if (relativeTop > currentLineTop.current) {
                    const diff = relativeTop - currentLineTop.current;
                    setTranslateY(prev => prev - diff);
                    currentLineTop.current = relativeTop;
                }
                else if (relativeTop < currentLineTop.current) {
                    const diff = currentLineTop.current - relativeTop;
                    setTranslateY(prev => prev + diff);
                    currentLineTop.current = relativeTop;
                }
            }
        };

        window.addEventListener('cursor-move', handleCursorMove);
        return () => window.removeEventListener('cursor-move', handleCursorMove);
    }, [charRefs]);

    if (status === 'finished') {
        const finalDuration = mode === 'time' ? config : timer;
        const typedWords = getTypedWords();
        return (
            <Results
                stats={stats}
                duration={finalDuration}
                restart={handleRestart}
                sessionKeys={sessionKeys}
                wpmHistory={wpmHistory}
                typedWords={typedWords}
                playSound={playKeyPress}
            />
        );
    }

    // Don't render typing area until words are loaded (prevents hydration mismatch)
    if (words.length === 0) {
        return (
            <div className="flex flex-col items-center w-full max-w-5xl">
                <div className="h-[140px] flex items-center justify-center">
                    <div className="text-text-secondary opacity-50">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col items-center w-full max-w-5xl outline-none"
            onClick={() => inputRef.current?.focus()}
        >
            {/* Hidden Input for Mobile/Focus capture */}
            <input
                ref={inputRef}
                type="text"
                className="absolute opacity-0 w-0 h-0"
                aria-label="Typing Input"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-gramm="false"
                onInput={handleInput}
            />

            <SettingsBar
                mode={mode}
                setMode={setMode}
                config={config}
                setConfig={setConfig}
                includePunctuation={includePunctuation}
                setIncludePunctuation={setIncludePunctuation}
                includeNumbers={includeNumbers}
                setIncludeNumbers={setIncludeNumbers}
                confidenceMode={confidenceMode}
                setConfidenceMode={setConfidenceMode}
                soundStyle={soundStyle}
                onSoundSettingsClick={() => setShowSoundSettings(true)}
                status={status}
            />

            <StatsBar
                status={status}
                timeLeft={timer}
                duration={mode === 'time' ? config : 0}
                statsRef={{ current: stats }}
            />

            <div
                className="relative w-full overflow-hidden cursor-text py-2" // Added vertical padding
                style={{
                    height: '140px',
                    // Removed mask-image to ensure perfect uniformity across all lines
                }}
            >
                {/* PAUSE OVERLAY - Click to Resume */}
                {status === 'paused' && (
                    <div
                        className="absolute inset-0 z-30 flex items-center justify-center bg-[#0e1014]/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
                        onClick={() => startTest()}
                    >
                        <div className="text-xl text-[var(--color-caret)] font-bold tracking-widest uppercase flex flex-col items-center gap-2">
                            <div className="text-4xl mb-2">⏸</div>
                            <div>Paused</div>
                            <div className="text-xs text-text-secondary font-medium tracking-normal opacity-70 mt-2">Click or Type to Resume</div>
                        </div>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className={`transition-all duration-200 ease-out flex flex-wrap content-start ${status === 'paused' ? 'blur-sm opacity-50' : ''}`}
                    style={{
                        transform: `translateY(${translateY}px)`,
                        lineHeight: '40px'
                    }}
                >
                    <Caret charRefs={charRefs} />

                    {words.map((word, i) => (
                        <Word
                            key={word.id}
                            word={word}
                            wordIdx={i}
                            registerRef={registerRef}
                            registerExtrasContainer={registerExtrasContainer}
                        />
                    ))}
                </div>

                {/* Gradient Overlays Removed for Uniform Brightness */}
            </div>

            {/* Reset Button - Tab-focusable */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <button
                    onClick={handleRestart}
                    className="px-6 py-2 rounded-md bg-white/5 border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/10 hover:text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]"
                    tabIndex={0}
                >
                    Restart Test
                </button>
                <div className="text-text-secondary text-xs opacity-40">
                    Tab + Enter → Restart Test • Esc → Instant Restart
                </div>
            </div>

            {/* Sound Settings Modal */}
            {showSoundSettings && (
                <SoundSettings
                    soundStyle={soundStyle}
                    setSoundStyle={setSoundStyle}
                    masterVolume={masterVolume}
                    setMasterVolume={setMasterVolume}
                    keyVolume={keyVolume}
                    setKeyVolume={setKeyVolume}
                    enableRelease={enableRelease}
                    setEnableRelease={setEnableRelease}
                    enableError={enableError}
                    setEnableError={setEnableError}
                    enableWordComplete={enableWordComplete}
                    setEnableWordComplete={setEnableWordComplete}
                    enableTestComplete={enableTestComplete}
                    setEnableTestComplete={setEnableTestComplete}
                    enableVariation={enableVariation}
                    setEnableVariation={setEnableVariation}
                    variationIntensity={variationIntensity}
                    setVariationIntensity={setVariationIntensity}
                    onPreviewSound={previewSound}
                    onClose={() => setShowSoundSettings(false)}
                />
            )}
        </div>
    );
}
