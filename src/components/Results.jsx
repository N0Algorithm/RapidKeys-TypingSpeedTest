import { useState, useEffect, useMemo } from 'react';
import { VisualKeyboard } from './VisualKeyboard';
import { AnimatedReplay } from './AnimatedReplay';

/**
 * Results.jsx - Fixed Layout
 * Hierarchy: Net WPM → Raw WPM → Secondary Stats → Graph → Analysis
 */
export const Results = ({ stats, duration, restart, sessionKeys, wpmHistory = [], typedWords = [] }) => {
    const [calculations, setCalculations] = useState({ wpm: 0, acc: 0, raw: 0, consistency: 0, correct: 0, incorrect: 0 });

    useEffect(() => {
        const { correct, incorrect, totalKeystrokes } = stats;
        const totalCharsTyped = correct + incorrect;
        const minutes = duration / 60;
        const safeMinutes = minutes < 0.01 ? 0.01 : minutes;

        const wpm = Math.round((correct / 5) / safeMinutes);
        const acc = totalCharsTyped > 0 ? Math.round((correct / totalCharsTyped) * 100) : 0;
        const raw = Math.round(((totalKeystrokes || totalCharsTyped) / 5) / safeMinutes);

        let consistency = 100;
        if (wpmHistory.length > 2) {
            const wpmValues = wpmHistory.map(h => h.wpm);
            const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
            const variance = wpmValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / wpmValues.length;
            const stdDev = Math.sqrt(variance);
            consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 2))));
        }

        setCalculations({ wpm, acc, raw, consistency, correct, incorrect });

        // Persist History
        try {
            const history = JSON.parse(localStorage.getItem('rapidkeys_history') || '[]');
            const newResult = { date: new Date().toISOString(), wpm, acc, raw, consistency, duration, correct, incorrect };
            const updatedHistory = [newResult, ...history].slice(0, 50);
            localStorage.setItem('rapidkeys_history', JSON.stringify(updatedHistory));
        } catch (e) { console.error("Failed to save result", e); }

        // Persist Key Stats
        if (sessionKeys && sessionKeys.size > 0) {
            try {
                const savedStats = JSON.parse(localStorage.getItem('rapidkeys_keystats') || '{}');
                Object.keys(savedStats).forEach(char => {
                    savedStats[char].errors = Math.floor(savedStats[char].errors * 0.9);
                });
                sessionKeys.forEach(({ total, errors }, char) => {
                    if (!savedStats[char]) savedStats[char] = { total: 0, errors: 0 };
                    savedStats[char].total += total;
                    savedStats[char].errors += errors;
                });
                localStorage.setItem('rapidkeys_keystats', JSON.stringify(savedStats));
            } catch (e) { console.error("Failed to save key stats", e); }
        }
    }, [stats, duration, sessionKeys, wpmHistory]);

    // Demoted graph: smaller dimensions
    const CHART_WIDTH = 500;
    const CHART_HEIGHT = 80;
    const PADDING = 8;

    const maxWpm = useMemo(() => {
        if (wpmHistory.length === 0) return 100;
        return Math.max(...wpmHistory.map(h => h.wpm), 10);
    }, [wpmHistory]);

    const chartPath = useMemo(() => {
        if (wpmHistory.length < 2) return '';
        const points = wpmHistory.map((p, i) => {
            const x = PADDING + (i / (wpmHistory.length - 1)) * (CHART_WIDTH - PADDING * 2);
            const y = CHART_HEIGHT - PADDING - ((p.wpm / maxWpm) * (CHART_HEIGHT - PADDING * 2));
            return { x, y };
        });
        return points.reduce((acc, point, i) => `${acc}${i === 0 ? 'M' : 'L'}${point.x},${point.y}`, '');
    }, [wpmHistory, maxWpm]);

    const areaPath = useMemo(() => {
        if (!chartPath) return '';
        return `${chartPath}L${CHART_WIDTH - PADDING},${CHART_HEIGHT - PADDING}L${PADDING},${CHART_HEIGHT - PADDING}Z`;
    }, [chartPath]);

    return (
        <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto py-6 px-4">

            {/* ═══════════════════════════════════════════════════════════
                HERO: Net WPM (dominant) + Raw WPM (secondary)
                Compressed vertical spacing, clear hierarchy
            ═══════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center mb-4">
                {/* NET WPM - Hero metric */}
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary opacity-50">net wpm</span>
                <span className="text-6xl font-bold text-[var(--color-caret)] leading-none">
                    {calculations.wpm}
                </span>

                {/* RAW WPM - Secondary, smaller, muted */}
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary opacity-40">raw</span>
                    <span className="text-2xl font-semibold text-text-primary opacity-70">{calculations.raw}</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECONDARY STATS: Compact horizontal row
            ═══════════════════════════════════════════════════════════ */}
            <div className="flex gap-6 mb-4">
                <div className="text-center">
                    <div className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40">acc</div>
                    <div className="text-lg text-text-primary font-medium">{calculations.acc}%</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40">consistency</div>
                    <div className="text-lg text-text-primary font-medium">{calculations.consistency}%</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] uppercase tracking-widest text-text-secondary opacity-40">chars</div>
                    <div className="text-lg text-text-primary font-medium">
                        {calculations.correct}<span className="text-text-secondary opacity-40">/</span><span className="text-red-500">{calculations.incorrect}</span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                GRAPH: Demoted, compact, supporting context only
            ═══════════════════════════════════════════════════════════ */}
            {wpmHistory.length > 1 && (
                <div className="w-full max-w-md mb-5 opacity-70">
                    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto">
                        {/* Minimal grid - just baseline */}
                        <line x1={PADDING} y1={CHART_HEIGHT - PADDING} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT - PADDING} stroke="#333" strokeOpacity="0.4" />

                        {/* Area - very subtle */}
                        <path d={areaPath} fill="var(--color-caret)" fillOpacity="0.08" />

                        {/* Line - thinner */}
                        <path d={chartPath} fill="none" stroke="var(--color-caret)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
                    </svg>
                    <div className="flex justify-between text-[9px] text-text-secondary opacity-30 px-1 -mt-1">
                        <span>0s</span>
                        <span>{duration}s</span>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                DIVIDER: Visual separation before analysis tools
            ═══════════════════════════════════════════════════════════ */}
            <div className="w-full max-w-sm h-px bg-white/5 mb-5" />

            {/* ═══════════════════════════════════════════════════════════
                ANALYSIS SECTION: Animated Replay with keyboard
            ═══════════════════════════════════════════════════════════ */}
            <div className="w-full flex flex-col items-center gap-4">
                {typedWords.length > 0 && (
                    <AnimatedReplay typedWords={typedWords} />
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ACTION: Restart button
            ═══════════════════════════════════════════════════════════ */}
            <button
                onClick={restart}
                className="mt-8 mb-8 px-6 py-2.5 rounded bg-[var(--color-caret)] text-[var(--color-bg-primary)] text-sm font-bold hover:brightness-110 transition-all"
            >
                Restart
            </button>
        </div>
    );
};
