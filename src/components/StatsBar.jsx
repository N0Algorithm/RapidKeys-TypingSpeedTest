import { useEffect, useState } from 'react';
import { calculateWPM, calculateAccuracy } from '../utils/metrics';

export const StatsBar = ({ status, timeLeft, duration, statsRef }) => {
    const [liveWpm, setLiveWpm] = useState(0);
    const [liveAcc, setLiveAcc] = useState(100);

    useEffect(() => {
        if (status !== 'running') return;

        // Poll stats refs for live updates without re-rendering parent
        const interval = setInterval(() => {
            const { correct, incorrect } = statsRef.current;
            const total = correct + incorrect;
            const timeElapsed = duration - timeLeft;

            // Prevent division by zero or negative time spikes
            if (timeElapsed > 0) {
                setLiveWpm(calculateWPM(correct, timeElapsed));
                setLiveAcc(calculateAccuracy(correct, total));
            }
        }, 250); // 4fps updates is plenty for reading

        return () => clearInterval(interval);
    }, [status, timeLeft, duration, statsRef]);

    return (
        <div className="flex w-full items-end justify-between px-4 pb-4 border-b border-white/5 mb-8">

            {/* Metrics Group */}
            <div className="flex gap-4 sm:gap-8 md:gap-12 text-base sm:text-xl items-end">

                {/* Timer */}
                <div className="flex flex-col gap-1 w-16 sm:w-20 md:w-24">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-text-secondary uppercase opacity-60">Time</span>
                    <div className="text-2xl sm:text-3xl font-bold text-[var(--color-caret)] tabular-nums">
                        {timeLeft}<span className="text-xs sm:text-sm text-text-secondary ml-0.5 sm:ml-1">s</span>
                    </div>
                </div>

                {/* Live WPM */}
                <div className="flex flex-col gap-1 w-20 sm:w-28 md:w-32">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-text-secondary uppercase opacity-60">WPM</span>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary tabular-nums drop-shadow-md">
                        {liveWpm}
                    </div>
                </div>

                {/* Accuracy */}
                <div className="flex flex-col gap-1 w-20 sm:w-28 md:w-32">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-text-secondary uppercase opacity-60">Accuracy</span>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary tabular-nums">
                        {liveAcc}%
                    </div>
                </div>
            </div>

            {/* Status / Instructions */}
            <div className="text-text-secondary text-[10px] sm:text-xs uppercase tracking-widest font-semibold opacity-50 pb-2">
                {status === 'idle' ? <span className="animate-pulse">Press any key to start typing...</span> : 'Test Running'}
            </div>
        </div>
    );
};
