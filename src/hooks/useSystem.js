import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSystem handles the high-level state of the typing test.
 * - Timer countdown (Time Mode) or CountUp (Word Mode)
 * - Test Status (idle, running, paused, finished)
 * - Pause Logic (Blur/Focus)
 * - Stats Collection (Consistency)
 */
export const useSystem = () => {
    const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'finished'

    // Configuration
    const [mode, setMode] = useState('time'); // 'time' | 'words'
    const [config, setConfig] = useState(30); // 30s or 30 words
    const [includePunctuation, setIncludePunctuation] = useState(false);
    const [includeNumbers, setIncludeNumbers] = useState(false);
    const [confidenceMode, setConfidenceMode] = useState(false); // Confidence Mode State

    // Sound Settings
    const [soundStyle, setSoundStyle] = useState('tick'); // 'tick' | 'smooth' | 'thud' | 'clacky' | 'thock' | 'beep' | 'off'
    const [masterVolume, setMasterVolume] = useState(0.5);
    const [keyVolume, setKeyVolume] = useState(0.8);
    const [enableRelease, setEnableRelease] = useState(false);
    const [enableError, setEnableError] = useState(true);
    const [enableWordComplete, setEnableWordComplete] = useState(false);
    const [enableTestComplete, setEnableTestComplete] = useState(true);
    const [enableVariation, setEnableVariation] = useState(true);
    const [variationIntensity, setVariationIntensity] = useState(0.5);

    // Timer State
    const [timer, setTimer] = useState(30); // Display value
    const timerRef = useRef(null);
    const startTimeRef = useRef(0);

    // Advanced Stats Tracking
    const historyRef = useRef([]); // Stores periodic WPM snapshots for consistency calc
    const lastSnapshotTime = useRef(0);

    // Initialize display timer when config changes
    useEffect(() => {
        if (status === 'idle') {
            setTimer(mode === 'time' ? config : 0);
            historyRef.current = [];
        }
    }, [config, mode, status]);

    // Load sound settings from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('rapidkeys_sound_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.soundStyle && ['tick', 'smooth', 'thud', 'clacky', 'thock', 'beep', 'off'].includes(settings.soundStyle)) {
                    setSoundStyle(settings.soundStyle);
                }
                if (typeof settings.masterVolume === 'number') setMasterVolume(settings.masterVolume);
                if (typeof settings.keyVolume === 'number') setKeyVolume(settings.keyVolume);
                if (typeof settings.enableRelease === 'boolean') setEnableRelease(settings.enableRelease);
                if (typeof settings.enableError === 'boolean') setEnableError(settings.enableError);
                if (typeof settings.enableWordComplete === 'boolean') setEnableWordComplete(settings.enableWordComplete);
                if (typeof settings.enableTestComplete === 'boolean') setEnableTestComplete(settings.enableTestComplete);
                if (typeof settings.enableVariation === 'boolean') setEnableVariation(settings.enableVariation);
                if (typeof settings.variationIntensity === 'number') setVariationIntensity(settings.variationIntensity);
            }
        } catch (e) {
            console.error('Failed to load sound settings', e);
        }
    }, []);

    // Persist sound settings to localStorage
    useEffect(() => {
        try {
            const settings = {
                soundStyle,
                masterVolume,
                keyVolume,
                enableRelease,
                enableError,
                enableWordComplete,
                enableTestComplete,
                enableVariation,
                variationIntensity
            };
            localStorage.setItem('rapidkeys_sound_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save sound settings', e);
        }
    }, [soundStyle, masterVolume, keyVolume, enableRelease, enableError, enableWordComplete, enableTestComplete, enableVariation, variationIntensity]);

    const startTest = useCallback(() => {
        if (status !== 'idle' && status !== 'paused') return;

        setStatus('running');
        if (status === 'idle') {
            startTimeRef.current = Date.now();
            historyRef.current = [];
        }

        // Only reset timer if strictly idle (not resuming)
        if (status === 'idle') {
            if (mode === 'time') {
                setTimer(config);
            } else {
                setTimer(0);
            }
        }
    }, [status, config, mode]);

    const endTest = useCallback(() => {
        setStatus('finished');
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const resetTest = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus('idle');
        setTimer(mode === 'time' ? config : 0);
        historyRef.current = [];
        window.focus();
    }, [mode, config]);

    // Handle Pause on Blur
    useEffect(() => {
        const handleBlur = () => {
            if (status === 'running') {
                setStatus('paused');
                if (timerRef.current) clearInterval(timerRef.current);
            }
        };

        // We don't auto-resume on focus to avoid accidental starts

        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('blur', handleBlur);
        };
    }, [status]);

    // Handle Timer Logic
    useEffect(() => {
        if (status === 'running') {
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    const nextVal = mode === 'time' ? prev - 1 : prev + 1;

                    if (mode === 'time' && nextVal <= 0) {
                        endTest();
                        return 0;
                    }
                    return nextVal;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, mode, endTest]);

    // WPM History Tracking (for consistency score)
    useEffect(() => {
        if (status !== 'running') return;

        const handleStatsUpdate = (e) => {
            const { correct, totalKeystrokes } = e.detail;
            const elapsed = (Date.now() - startTimeRef.current) / 1000;

            // Sample every 2 seconds
            if (elapsed - lastSnapshotTime.current >= 2) {
                const minutes = elapsed / 60;
                const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
                historyRef.current.push({ time: Math.floor(elapsed), wpm });
                lastSnapshotTime.current = elapsed;
            }
        };

        window.addEventListener('stats-update', handleStatsUpdate);
        return () => window.removeEventListener('stats-update', handleStatsUpdate);
    }, [status]);


    return {
        status,
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
        // Actions
        startTest,
        endTest,
        resetTest,
        setStatus,
        wpmHistory: historyRef.current
    };
};
