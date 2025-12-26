import { useRef, useEffect, useState } from 'react';

/**
 * Caret Component
 * 
 * Renders the blinking cursor.
 * Uses a custom 'cursor-move' event to update position avoiding React render cycle.
 */
export const Caret = ({ charRefs }) => {
    const caretRef = useRef(null);
    const [initPos, setInitPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Initial Position: Use RAF polling instead of fixed timeout
        // This avoids race conditions when word rendering is slow
        let attempts = 0;
        const maxAttempts = 20; // ~333ms max wait at 60fps

        const checkPosition = () => {
            const firstNode = charRefs.current.get('0-0');
            if (firstNode && caretRef.current) {
                setInitPos({ x: firstNode.offsetLeft, y: firstNode.offsetTop });
                return; // Done
            }

            attempts++;
            if (attempts < maxAttempts) {
                requestAnimationFrame(checkPosition);
            }
        };

        requestAnimationFrame(checkPosition);
    }, [charRefs]);

    useEffect(() => {
        const handleMove = (e) => {
            const { wordIndex, charIndex } = e.detail;

            // Use RAF to wait for React to render any new extra characters
            requestAnimationFrame(() => {
                const nodeKey = `${wordIndex}-${charIndex}`;
                let node = charRefs.current.get(nodeKey);

                if (!caretRef.current) return;

                if (node) {
                    // Move to character
                    const x = node.offsetLeft;
                    const y = node.offsetTop;
                    caretRef.current.style.transform = `translate(${x}px, ${y}px)`;
                } else {
                    // Node doesn't exist yet - find the last available character
                    let foundNode = null;
                    let searchIndex = charIndex - 1;

                    while (searchIndex >= 0 && !foundNode) {
                        const searchKey = `${wordIndex}-${searchIndex}`;
                        foundNode = charRefs.current.get(searchKey);
                        if (!foundNode) searchIndex--;
                    }

                    if (foundNode) {
                        // Move to right side of the last found char
                        const x = foundNode.offsetLeft + foundNode.offsetWidth;
                        const y = foundNode.offsetTop;
                        caretRef.current.style.transform = `translate(${x}px, ${y}px)`;
                    }
                }

                // Reset animation on move
                caretRef.current.classList.remove('animate-blink');
                void caretRef.current.offsetWidth;
                caretRef.current.classList.add('animate-blink');
            });
        };

        const handleReset = () => {
            // Go back to start
            const node = charRefs.current.get('0-0');
            if (node && caretRef.current) {
                caretRef.current.style.transform = `translate(${node.offsetLeft}px, ${node.offsetTop}px)`;
            }
        };

        window.addEventListener('cursor-move', handleMove);
        window.addEventListener('caret-reset', handleReset);

        return () => {
            window.removeEventListener('cursor-move', handleMove);
            window.removeEventListener('caret-reset', handleReset);
        };
    }, [charRefs]);

    return (
        <div
            ref={caretRef}
            className="absolute top-0 left-0 w-0.5 h-8 bg-[var(--color-caret)] rounded-full transition-transform duration-100 ease-out z-10 animate-blink will-change-transform caret-glow"
            style={{
                transform: `translate(${initPos.x}px, ${initPos.y}px)`,
                // Visual adjustment to center vertically if needed, or match height
            }}
        />
    );
};
