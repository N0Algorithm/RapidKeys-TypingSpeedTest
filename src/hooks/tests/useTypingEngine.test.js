import { renderHook, act } from '@testing-library/react';
import { useTypingEngine } from '../useTypingEngine';

jest.mock('../../utils/words', () => ({
  generateWords: jest.fn(() => [
    { id: 'w1', chars: ['h', 'i'] },
    { id: 'w2', chars: ['o', 'k'] }
  ])
}));

jest.mock('../../utils/quotes', () => ({
  generateQuote: jest.fn(() => [{ id: 'q1', chars: ['q', 'u', 'o', 't', 'e'] }])
}));

describe('useTypingEngine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes words and starts test on first input when idle', () => {
    const startTest = jest.fn();
    const endTest = jest.fn();
    const resetTest = jest.fn();

    const { result } = renderHook(() =>
      useTypingEngine('idle', startTest, endTest, resetTest, 'words', 2, false, false, false)
    );

    expect(result.current.words.length).toBeGreaterThan(0);

    act(() => {
      result.current.handleInput({
        nativeEvent: { inputType: 'insertText', data: 'h' }
      });
    });

    expect(startTest).toHaveBeenCalledTimes(1);
    expect(result.current.stats.correct).toBe(1);
  });
});
