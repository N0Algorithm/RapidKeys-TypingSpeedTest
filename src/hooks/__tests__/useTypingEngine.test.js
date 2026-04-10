import { renderHook, act } from '@testing-library/react-hooks';
import { useTypingEngine } from '../useTypingEngine';

// Mock dependencies
jest.mock('../../utils/words', () => ({
    generateWords: jest.fn(() => [
        { id: 'word-0', string: 'test', chars: ['t', 'e', 's', 't'] },
        { id: 'word-1', string: 'word', chars: ['w', 'o', 'r', 'd'] }
    ])
}));

jest.mock('../../utils/quotes', () => ({
    generateQuote: jest.fn(() => [
        { id: 'quote-0', string: 'some', chars: ['s', 'o', 'm', 'e'] },
        { id: 'quote-1', string: 'quote', chars: ['q', 'u', 'o', 't', 'e'] }
    ])
}));

describe('useTypingEngine', () => {
    const mockStartTest = jest.fn();
    const mockEndTest = jest.fn();
    const mockResetTest = jest.fn();
    const renderTypingEngine = ({
        status = 'idle',
        mode = 'time',
        config = 30,
        includePunctuation = false,
        includeNumbers = false,
        confidenceMode = false
    } = {}) => renderHook(() => useTypingEngine(
        status,
        mockStartTest,
        mockEndTest,
        mockResetTest,
        mode,
        config,
        includePunctuation,
        includeNumbers,
        confidenceMode
    ));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with correctly generated words', () => {
        const { result } = renderTypingEngine();
        
        expect(result.current.words.length).toBeGreaterThan(0);
        expect(result.current.words[0].string).toBe('test');
    });

    it('advances the cursor when handleInput receives a valid character', () => {
        const { result } = renderTypingEngine({ status: 'running' });

        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 0 });

        act(() => {
            result.current.handleInput({
                nativeEvent: {
                    inputType: 'insertText',
                    data: 't'
                }
            });
        });

        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 1 });
    });

    it('resets correctly when requested', () => {
        const { result } = renderTypingEngine({ status: 'running' });

        act(() => {
            result.current.handleInput({
                nativeEvent: {
                    inputType: 'insertText',
                    data: 't'
                }
            });
        });

        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 1 });
        expect(result.current.stats).toEqual({ correct: 1, incorrect: 0, extra: 0, totalKeystrokes: 1 });

        act(() => {
            result.current.resetEngine();
        });

        expect(result.current.cursor).toEqual({ wordIndex: 0, charIndex: 0 });
        expect(result.current.stats).toEqual({ correct: 0, incorrect: 0, extra: 0, totalKeystrokes: 0 });
    });
});
