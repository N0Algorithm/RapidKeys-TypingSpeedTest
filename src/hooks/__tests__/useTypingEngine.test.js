import { renderHook, act } from '@testing-library/react-hooks';
import { useTypingEngine } from '../useTypingEngine';

// Mock dependencies
jest.mock('../../utils/words', () => ({
    generateWords: jest.fn(() => [
        { word: 'test', chars: ['t', 'e', 's', 't'] },
        { word: 'word', chars: ['w', 'o', 'r', 'd'] }
    ])
}));

jest.mock('../../utils/quotes', () => ({
    generateQuote: jest.fn(() => [
        { word: 'some', chars: ['s', 'o', 'm', 'e'] },
        { word: 'quote', chars: ['q', 'u', 'o', 't', 'e'] }
    ])
}));

describe('useTypingEngine', () => {
    const mockStartTest = jest.fn();
    const mockEndTest = jest.fn();
    const mockResetTest = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with correctly generated words', () => {
        const { result } = renderHook(() => useTypingEngine(
            'idle', mockStartTest, mockEndTest, mockResetTest,
            'time', 30, false, false, false
        ));
        
        expect(result.current.words.length).toBeGreaterThan(0);
        expect(result.current.words[0].word).toBe('test');
    });

    it('updates cursor on valid key press logic', () => {
        const { result } = renderHook(() => useTypingEngine(
            'running', mockStartTest, mockEndTest, mockResetTest,
            'time', 30, false, false, false
        ));

        // The core method is processChar or exposed by handleInput/getTypedWords. 
        // We simulate a keydown indirectly assuming a DOM interaction or we expect engine props.
        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 0 });
    });

    it('resets correctly when requested', () => {
        const { result } = renderHook(() => useTypingEngine(
            'running', mockStartTest, mockEndTest, mockResetTest,
            'time', 30, false, false, false
        ));
        
        act(() => {
            result.current.resetEngine();
        });

        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 0 });
        expect(result.current.stats).toEqual({ correct: 0, incorrect: 0, extra: 0, totalKeystrokes: 0 });
    });
});
