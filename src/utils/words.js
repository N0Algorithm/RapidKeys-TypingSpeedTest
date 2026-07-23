/**
 * words.js
 * 
 * Contains a curated list of common English words and a generator function
 * to produce random paragraphs for the typing test.
 */

import { QUOTES } from './quotes';

const PUNCTUATION = ['.', ',', ';', ':', '?', '!'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function transformWord(word, usePunctuation, useNumbers) {
    let result = word;

    // Chance to capitalize
    if (Math.random() < 0.2) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    // Chance to return a number string
    if (useNumbers && Math.random() < 0.1) {
        return String(Math.floor(Math.random() * 999));
    }

    // Chance to add punctuation
    if (usePunctuation && Math.random() < 0.2) {
        const mark = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
        result += mark;
    }

    return result;
}

/**
 * Generates a random list of words with optional adaptive weighting.
 * 
 * @param {number} count - The number of words to generate.
 * @param {boolean} punctuation - Include punctuation.
 * @param {boolean} numbers - Include numbers.
 * @param {Array<string>} weakKeys - List of characters to prioritize.
 * @returns {Array<Object>} - Array of word objects { string, characters, id }.
 */
export function generateWords(count = 50, punctuation = false, numbers = false, weakKeys = []) {
    // Collect sentences to pull words from
    let pool = [];
    if (weakKeys.length > 0) {
        // Try to find quotes containing weak keys
        pool = QUOTES.long.filter(q => weakKeys.some(k => q.toLowerCase().includes(k.toLowerCase())));
    }
    
    // Fallback to all long and medium quotes if pool is empty
    if (pool.length === 0) {
        pool = [...QUOTES.long, ...QUOTES.medium];
    }
    
    // Shuffle the pool of quotes
    pool = pool.sort(() => Math.random() - 0.5);

    // Concatenate quotes until we have enough words
    let combinedText = '';
    for (const quote of pool) {
        combinedText += quote + ' ';
        if (combinedText.split(' ').length >= count * 1.5) break; // Buffer
    }

    let rawWords = combinedText.split(' ').filter(w => w.length > 0);
    
    // Fallback if we still need more words
    while (rawWords.length < count) {
        rawWords = [...rawWords, ...rawWords];
    }
    
    // Take exactly the count requested
    rawWords = rawWords.slice(0, count);

    // If punctuation is explicitly OFF, strip it from the quotes
    if (!punctuation) {
        rawWords = rawWords.map(w => w.replace(/[.,;:?!]/g, '').toLowerCase());
    }
    
    // If numbers are requested, occasionally inject a number
    if (numbers) {
        rawWords = rawWords.map(w => Math.random() < 0.1 ? String(Math.floor(Math.random() * 999)) : w);
    }

    return rawWords.map((rawWord, i) => ({
        id: `word-${i}`,
        string: rawWord,
        chars: rawWord.split(''),
    }));
}
