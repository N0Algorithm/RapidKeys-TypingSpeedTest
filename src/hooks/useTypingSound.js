import { useRef, useCallback, useEffect } from 'react';

/**
 * useTypingSound - File-based typing sound system
 * 
 * Features:
 * - 4 file-based styles: Tick, Smooth, Thud, Clacky
 * - 2 programmatic styles: Beep, Silent
 * - Additional sounds: Error, Word Complete, Test Complete
 * - Per-key micro-variation (volume/pitch)
 * - Device-aware tuning (headphones/speakers)
 * - Randomized key variations for natural feel
 * 
 * Sound files are served from /public/sounds/
 */

// =============================================================================
// SOUND FILE MAPPING
// =============================================================================

/**
 * Maps each sound style to its audio files.
 * Multiple files = random selection per keystroke for variation.
 */
const SOUND_FILES = {
    tick: {
        press: [
            '/sounds/tick/key1.wav',
            '/sounds/tick/key2.wav',
            '/sounds/tick/key3.wav',
            '/sounds/tick/key4.wav',
            '/sounds/tick/key5.wav',
            '/sounds/tick/key6.wav'
        ],
        space: ['/sounds/tick/space1.wav', '/sounds/tick/space2.wav']
    },
    smooth: {
        press: [
            '/sounds/smooth/banana-s-1.wav',
            '/sounds/smooth/banana-s-2.wav',
            '/sounds/smooth/banana-s-3.wav',
            '/sounds/smooth/banana-s-4.wav',
            '/sounds/smooth/banana-s-5.wav',
            '/sounds/smooth/banana-s-6.wav'
        ]
    },
    thud: {
        press: ['/sounds/thud/Glorious.ogg']
    },
    clacky: {
        press: [
            '/sounds/clacky/01.wav',
            '/sounds/clacky/02.wav',
            '/sounds/clacky/03.wav',
            '/sounds/clacky/04.wav',
            '/sounds/clacky/05.wav',
            '/sounds/clacky/06.wav',
            '/sounds/clacky/charenter_01.wav',
            '/sounds/clacky/charenter_02.wav',
            '/sounds/clacky/charenter_03.wav'
        ]
    },
    thock: {
        press: ['/sounds/thock/Creams.ogg']
    }
};

// Programmatic sound definitions (for beep and auxiliary sounds)
const PROGRAMMATIC_SOUNDS = {
    beep: { frequency: 2000, duration: 0.025, decay: 70, noiseAmount: 0.01 },
    error: { frequency: 600, duration: 0.030, decay: 70, noiseAmount: 0.10, volume: 0.12 },
    wordComplete: { frequency: 1400, harmonic: 2100, duration: 0.045, decay: 45, harmonicMix: 0.25, volume: 0.10 },
    testComplete: { frequency: 880, harmonic: 1320, duration: 0.180, decay: 12, harmonicMix: 0.35, volume: 0.22 }
};

// =============================================================================
// HOOK
// =============================================================================

export const useTypingSound = (settings) => {
    const {
        soundStyle = 'tick',
        masterVolume = 0.5,
        keyVolume = 0.8,
        enableRelease = false,
        enableError = true,
        enableWordComplete = false,
        enableTestComplete = true,
        enableVariation = true,
        variationIntensity = 0.5
    } = settings || {};

    // Refs for audio context and buffers
    const audioContextRef = useRef(null);
    const audioBuffersRef = useRef({});
    const programmaticBuffersRef = useRef({});
    const isInitializedRef = useRef(false);
    const loadingRef = useRef(false);

    /**
     * Get micro-variation multipliers
     */
    const getMicroVariation = useCallback(() => {
        if (!enableVariation) return { volume: 1, pitch: 1 };

        const volumeRange = 0.03 + (variationIntensity * 0.07);
        const pitchRange = 0.01 + (variationIntensity * 0.03);

        return {
            volume: 1 + (Math.random() * 2 - 1) * volumeRange,
            pitch: 1 + (Math.random() * 2 - 1) * pitchRange
        };
    }, [enableVariation, variationIntensity]);

    /**
     * Generate a programmatic sound buffer
     */
    const generateProgrammaticBuffer = useCallback((config) => {
        if (!audioContextRef.current) return null;

        const ctx = audioContextRef.current;
        const sampleRate = ctx.sampleRate;
        const duration = config.duration;
        const samples = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * config.decay);

            let sample = Math.sin(2 * Math.PI * config.frequency * t) * envelope;

            if (config.harmonic && config.harmonicMix) {
                sample += Math.sin(2 * Math.PI * config.harmonic * t) * envelope * config.harmonicMix;
            }

            if (config.noiseAmount) {
                sample += (Math.random() - 0.5) * config.noiseAmount * envelope;
            }

            data[i] = Math.max(-1, Math.min(1, sample * 0.7));
        }

        return buffer;
    }, []);

    /**
     * Load a single audio file and decode it
     */
    const loadAudioFile = useCallback(async (url) => {
        if (!audioContextRef.current) return null;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.warn(`Failed to load sound: ${url}`, error);
            return null;
        }
    }, []);

    /**
     * Preload all audio files
     */
    const preloadAllSounds = useCallback(async () => {
        if (loadingRef.current || !audioContextRef.current) return;
        loadingRef.current = true;

        const buffers = {};

        // Load file-based sounds
        for (const [style, files] of Object.entries(SOUND_FILES)) {
            buffers[style] = { press: [], space: [] };

            if (files.press) {
                for (const url of files.press) {
                    const buffer = await loadAudioFile(url);
                    if (buffer) buffers[style].press.push(buffer);
                }
            }

            if (files.space) {
                for (const url of files.space) {
                    const buffer = await loadAudioFile(url);
                    if (buffer) buffers[style].space.push(buffer);
                }
            }
        }

        audioBuffersRef.current = buffers;

        // Generate programmatic sounds
        const programmatic = {};
        for (const [name, config] of Object.entries(PROGRAMMATIC_SOUNDS)) {
            programmatic[name] = generateProgrammaticBuffer(config);
        }
        programmaticBuffersRef.current = programmatic;

        loadingRef.current = false;
    }, [loadAudioFile, generateProgrammaticBuffer]);

    /**
     * Initialize audio context and preload sounds
     */
    const initAudio = useCallback(async () => {
        if (isInitializedRef.current) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            await preloadAllSounds();
            isInitializedRef.current = true;
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
        }
    }, [preloadAllSounds]);

    /**
     * Play a sound buffer with variation
     */
    const playSoundBuffer = useCallback((buffer, baseVolume) => {
        if (!buffer || !audioContextRef.current) return;

        try {
            const ctx = audioContextRef.current;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const { volume: volumeVar, pitch: pitchVar } = getMicroVariation();

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = pitchVar;

            const gainNode = ctx.createGain();
            const finalVolume = masterVolume * baseVolume * volumeVar;
            gainNode.gain.value = Math.min(1, finalVolume);

            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            source.start(0);
        } catch (error) {
            // Silent fail
        }
    }, [masterVolume, getMicroVariation]);

    /**
     * Get random buffer from array
     */
    const getRandomBuffer = useCallback((buffers) => {
        if (!buffers || buffers.length === 0) return null;
        return buffers[Math.floor(Math.random() * buffers.length)];
    }, []);

    /**
     * Play key press sound
     * @param {string|null} styleOverride - Optional style to play instead of current setting
     */
    const playKeyPress = useCallback((styleOverride = null) => {
        const activeStyle = styleOverride || soundStyle;
        if (activeStyle === 'off') return;

        // File-based styles
        const styleBuffers = audioBuffersRef.current[activeStyle];
        if (styleBuffers?.press?.length > 0) {
            const buffer = getRandomBuffer(styleBuffers.press);
            playSoundBuffer(buffer, keyVolume);
            return;
        }

        // Programmatic styles (beep, silent)
        const programmaticBuffer = programmaticBuffersRef.current[activeStyle];
        if (programmaticBuffer) {
            playSoundBuffer(programmaticBuffer, keyVolume);
        }
    }, [soundStyle, keyVolume, playSoundBuffer, getRandomBuffer]);

    /**
     * Play key release sound (if enabled)
     */
    const playKeyRelease = useCallback(() => {
        if (soundStyle === 'off' || !enableRelease) return;

        // Use same sound at lower volume for release
        const styleBuffers = audioBuffersRef.current[soundStyle];
        if (styleBuffers?.press?.length > 0) {
            const buffer = getRandomBuffer(styleBuffers.press);
            playSoundBuffer(buffer, keyVolume * 0.3);
        }
    }, [soundStyle, keyVolume, enableRelease, playSoundBuffer, getRandomBuffer]);

    /**
     * Play error sound
     */
    const playError = useCallback(() => {
        if (!enableError) return;

        const buffer = programmaticBuffersRef.current.error;
        if (buffer) {
            playSoundBuffer(buffer, PROGRAMMATIC_SOUNDS.error.volume);
        }
    }, [enableError, playSoundBuffer]);

    /**
     * Play word complete sound
     */
    const playWordComplete = useCallback(() => {
        if (!enableWordComplete) return;

        const buffer = programmaticBuffersRef.current.wordComplete;
        if (buffer) {
            playSoundBuffer(buffer, PROGRAMMATIC_SOUNDS.wordComplete.volume);
        }
    }, [enableWordComplete, playSoundBuffer]);

    /**
     * Play test complete sound
     */
    const playTestComplete = useCallback(() => {
        if (!enableTestComplete) return;

        const buffer = programmaticBuffersRef.current.testComplete;
        if (buffer) {
            playSoundBuffer(buffer, PROGRAMMATIC_SOUNDS.testComplete.volume);
        }
    }, [enableTestComplete, playSoundBuffer]);

    /**
     * Play test sound (for settings preview)
     */
    const playTestSound = useCallback(() => {
        playKeyPress();
    }, [playKeyPress]);

    /**
     * Update device tuning (regenerates programmatic buffers)
     */
    const updateDeviceTuning = useCallback(() => {
        if (!isInitializedRef.current) return;

        // Regenerate programmatic sounds with new tuning
        const programmatic = {};
        for (const [name, config] of Object.entries(PROGRAMMATIC_SOUNDS)) {
            programmatic[name] = generateProgrammaticBuffer(config);
        }
        programmaticBuffersRef.current = programmatic;
    }, [generateProgrammaticBuffer]);

    // Regenerate programmatic sounds when variations change
    useEffect(() => {
        if (isInitializedRef.current) {
            updateDeviceTuning();
        }
    }, [updateDeviceTuning]);

    return {
        initAudio,
        updateDeviceTuning,
        playKeyPress,
        previewSound: playKeyPress, // Alias for previewing specific styles
        playKeyRelease,
        playError,
        playWordComplete,
        playTestComplete,
        playTestSound
    };
};
