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
        startTest,
        endTest,
        resetTest,
        setStatus,
        wpmHistory: historyRef.current
    };
};
