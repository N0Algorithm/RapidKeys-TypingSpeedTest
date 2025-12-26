import { memo, useState } from 'react';

const SettingsBar = memo(({
    mode, setMode,
    config, setConfig,
    includePunctuation, setIncludePunctuation,
    includeNumbers, setIncludeNumbers,
    confidenceMode, setConfidenceMode,
    status
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (status !== 'idle') return null;

    // Shared button styles
    const toggleBtnClass = (active, color = 'caret') =>
        `cursor-pointer px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${active
            ? color === 'red'
                ? 'text-red-400 bg-red-400/15 ring-1 ring-red-400/20'
                : 'text-[var(--color-caret)] bg-[var(--color-caret)]/15 ring-1 ring-[var(--color-caret)]/20'
            : 'text-text-secondary opacity-60 hover:opacity-100 hover:text-text-primary hover:bg-white/5'
        }`;

    const modeBtnClass = (isActive) =>
        `cursor-pointer px-3 py-1 rounded text-sm transition-colors ${isActive ? 'text-[var(--color-caret)] font-bold' : 'text-text-secondary hover:text-text-primary'
        }`;

    // --- MOBILE MENU (Full Screen Modal) ---
    const MobileMenu = () => (
        <div
            className={`fixed inset-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-all duration-200 ease-out ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
        >
            {/* Close Button */}
            <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-6 text-text-secondary hover:text-text-primary text-2xl transition-colors"
                aria-label="Close Settings"
            >
                ✕
            </button>

            <div className="flex flex-col gap-6 w-full max-w-xs">
                {/* Mode Selection */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-widest text-text-secondary opacity-60 mb-1">Mode</span>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => { setMode('time'); setConfig(60); }} className={modeBtnClass(mode === 'time')}>Time</button>
                        <button onClick={() => { setMode('words'); setConfig(25); }} className={modeBtnClass(mode === 'words')}>Words</button>
                        <button onClick={() => { setMode('quote'); setConfig('medium'); }} className={modeBtnClass(mode === 'quote')}>Quotes</button>
                    </div>
                </div>

                {/* Duration/Word Count */}
                {mode !== 'quote' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-widest text-text-secondary opacity-60 mb-1">{mode === 'time' ? 'Duration' : 'Word Count'}</span>
                        <div className="flex gap-2 justify-center flex-wrap">
                            {(mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(val => (
                                <button key={val} onClick={() => setConfig(val)} className={modeBtnClass(config === val)}>{val}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quote Length */}
                {mode === 'quote' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-widest text-text-secondary opacity-60 mb-1">Quote Length</span>
                        <div className="flex gap-2 justify-center">
                            {['short', 'medium', 'long'].map(len => (
                                <button key={len} onClick={() => setConfig(len)} className={modeBtnClass(config === len)}>{len}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toggles */}
                {mode !== 'quote' && (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-widest text-text-secondary opacity-60 mb-1">Options</span>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <button onClick={() => setIncludePunctuation(p => !p)} className={toggleBtnClass(includePunctuation)}>.,!? Punctuation</button>
                            <button onClick={() => setIncludeNumbers(n => !n)} className={toggleBtnClass(includeNumbers)}># Numbers</button>
                            <button onClick={() => setConfidenceMode(c => !c)} className={toggleBtnClass(confidenceMode, 'red')}>⚡ Confidence</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // --- DESKTOP BAR (Inline) ---
    const DesktopBar = () => (
        <div
            className="hidden md:flex items-center justify-center gap-4 lg:gap-8 mb-8 p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/5 animate-in fade-in slide-in-from-top-4 duration-500"
            role="toolbar"
            aria-label="Test Settings"
        >
            {/* Toggles - Hidden in Quotes mode */}
            <div className={`flex gap-2 transition-all duration-300 ease-out origin-left ${mode === 'quote' ? 'opacity-0 scale-95 w-0 overflow-hidden pointer-events-none' : 'opacity-100 scale-100'}`}>
                <button onClick={() => setIncludePunctuation(p => !p)} className={toggleBtnClass(includePunctuation)} title="Toggle Punctuation" tabIndex={-1}>
                    <span className="text-base opacity-50">.,!?</span><span className="hidden lg:inline">punctuations</span>
                </button>
                <button onClick={() => setIncludeNumbers(n => !n)} className={toggleBtnClass(includeNumbers)} title="Toggle Numbers" tabIndex={-1}>
                    <span className="text-base opacity-50">#</span><span className="hidden lg:inline">numbers</span>
                </button>
                <button onClick={() => setConfidenceMode(c => !c)} className={toggleBtnClass(confidenceMode, 'red')} title="Confidence Mode" tabIndex={-1}>
                    <span className="text-base opacity-50">⚡</span><span className="hidden lg:inline">confidence</span>
                </button>
            </div>

            <div className={`w-px h-4 bg-white/10 transition-all duration-300 ${mode === 'quote' ? 'opacity-0 w-0' : 'opacity-100'}`} role="separator" />

            {/* Mode Selector */}
            <div className="flex gap-2" role="group" aria-label="Test Mode">
                <button onClick={() => { setMode('time'); setConfig(60); }} className={modeBtnClass(mode === 'time')} tabIndex={-1}>Time</button>
                <button onClick={() => { setMode('words'); setConfig(25); }} className={modeBtnClass(mode === 'words')} tabIndex={-1}>Words</button>
                <button onClick={() => { setMode('quote'); setConfig('medium'); }} className={modeBtnClass(mode === 'quote')} tabIndex={-1}>Quotes</button>
            </div>

            <div className={`w-px h-4 bg-white/10 transition-all duration-300 ${mode === 'quote' ? 'opacity-0 w-0' : 'opacity-100'}`} role="separator" />

            {/* Config Options */}
            <div className={`flex gap-2 transition-all duration-300 ease-out origin-right ${mode === 'quote' ? 'opacity-0 scale-95 w-0 overflow-hidden pointer-events-none' : 'opacity-100 scale-100'}`}>
                {(mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(val => (
                    <button key={val} onClick={() => setConfig(val)} className={modeBtnClass(config === val)} tabIndex={-1}>{val}</button>
                ))}
            </div>

            {/* Quotes Length Options */}
            <div className={`flex gap-2 transition-all duration-300 ease-out origin-left ${mode !== 'quote' ? 'opacity-0 scale-95 w-0 overflow-hidden pointer-events-none' : 'opacity-100 scale-100'}`}>
                {['short', 'medium', 'long'].map(len => (
                    <button key={len} onClick={() => setConfig(len)} className={modeBtnClass(config === len)} style={{ textTransform: 'capitalize' }} tabIndex={-1}>{len}</button>
                ))}
            </div>
        </div>
    );

    // --- MOBILE TRIGGER (Visible on small screens) ---
    const MobileTrigger = () => (
        <div className="md:hidden flex justify-center mb-8">
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Open Settings"
            >
                <span className="text-lg">⚙</span>
                <span className="text-sm font-medium">Test Settings</span>
            </button>
        </div>
    );

    return (
        <>
            <MobileTrigger />
            <DesktopBar />
            <MobileMenu />
        </>
    );
});

SettingsBar.displayName = 'SettingsBar';
export default SettingsBar;
