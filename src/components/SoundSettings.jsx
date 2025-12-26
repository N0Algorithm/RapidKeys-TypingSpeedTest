import { memo } from 'react';

/**
 * SoundSettings - Advanced sound settings panel
 * 
 * Features:
 * - Sound style selector (Click/Thock/Linear/Silent/Off)
 * - Toggle switches for additional sounds
 * - Volume sliders with live feedback
 * - Device output selector
 * - Test sound button
 */

const SoundSettings = memo(({
    soundStyle,
    setSoundStyle,
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
    onPreviewSound,
    onClose
}) => {
    // Style button classes
    const styleBtnClass = (isActive) =>
        `px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${isActive
            ? 'bg-[var(--color-caret)] text-[var(--color-bg-primary)] shadow-[0_0_10px_var(--color-caret)]'
            : 'text-text-secondary bg-white/5 hover:bg-white/10 hover:text-text-primary'
        }`;

    // Toggle switch component
    const Toggle = ({ label, checked, onChange, description }) => (
        <label className="flex items-center justify-between py-2 cursor-pointer group">
            <div className="flex flex-col">
                <span className="text-sm text-text-primary group-hover:text-[var(--color-caret)] transition-colors">
                    {label}
                </span>
                {description && (
                    <span className="text-xs text-text-secondary opacity-60">{description}</span>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-all ${checked
                    ? 'bg-[var(--color-caret)]'
                    : 'bg-white/10'
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </label>
    );

    // Slider component
    const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.01 }) => (
        <div className="py-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-text-primary">{label}</span>
                <span className="text-xs text-text-secondary tabular-nums">
                    {Math.round(value * 100)}%
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[var(--color-caret)]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110"
            />
        </div>
    );

    // Section header
    const SectionHeader = ({ children }) => (
        <h3 className="text-xs uppercase tracking-widest text-text-secondary opacity-60 mt-4 mb-2 first:mt-0">
            {children}
        </h3>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md mx-4 bg-[var(--color-bg-primary)] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <span className="text-xl">🔊</span>
                        Sound Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary text-xl transition-colors p-1"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Sound Style */}
                    <SectionHeader>Sound Style</SectionHeader>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['tick', 'smooth', 'thud', 'clacky', 'thock', 'beep', 'off'].map((style) => (
                            <button
                                key={style}
                                onClick={() => {
                                    setSoundStyle(style);
                                    if (style !== 'off') onPreviewSound(style);
                                }}
                                className={styleBtnClass(soundStyle === style)}
                            >
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Additional Sounds */}
                    <SectionHeader>Additional Sounds</SectionHeader>
                    <div className="space-y-1">
                        <Toggle
                            label="Key Release"
                            description="Soft sound on key up"
                            checked={enableRelease}
                            onChange={setEnableRelease}
                        />
                        <Toggle
                            label="Error Sound"
                            description="Subtle tick on wrong key"
                            checked={enableError}
                            onChange={setEnableError}
                        />
                        <Toggle
                            label="Word Complete"
                            description="Light ding after each word"
                            checked={enableWordComplete}
                            onChange={setEnableWordComplete}
                        />
                        <Toggle
                            label="Test Complete"
                            description="Sound when test ends"
                            checked={enableTestComplete}
                            onChange={setEnableTestComplete}
                        />
                    </div>


                    {/* Volume Controls */}
                    <SectionHeader>Volume</SectionHeader>
                    <Slider
                        label="Master Volume"
                        value={masterVolume}
                        onChange={setMasterVolume}
                    />
                    <Slider
                        label="Key Press Volume"
                        value={keyVolume}
                        onChange={setKeyVolume}
                    />

                    {/* Advanced */}
                    <SectionHeader>Advanced</SectionHeader>
                    <Toggle
                        label="Sound Variation"
                        description="Subtle per-key randomness"
                        checked={enableVariation}
                        onChange={setEnableVariation}
                    />
                    {enableVariation && (
                        <Slider
                            label="Variation Intensity"
                            value={variationIntensity}
                            onChange={setVariationIntensity}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/5 flex justify-end items-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-[var(--color-caret)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
});

SoundSettings.displayName = 'SoundSettings';
export default SoundSettings;
