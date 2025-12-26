/**
 * words.js
 * 
 * Contains a curated list of common English words and a generator function
 * to produce random paragraphs for the typing test.
 */

const COMMON_WORDS = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

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

    // Create a pool of "biased" words that contain weak keys
    let biasedWords = [];
    if (weakKeys.length > 0) {
        biasedWords = COMMON_WORDS.filter(w => weakKeys.some(k => w.includes(k)));
    }

    return Array.from({ length: count }, (_, i) => {
        let rawWord;

        // 40% chance to pick a word containing a weak key (if ANY exist)
        if (biasedWords.length > 0 && Math.random() < 0.4) {
            rawWord = biasedWords[Math.floor(Math.random() * biasedWords.length)];
        } else {
            rawWord = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
        }

        if (punctuation || numbers) {
            rawWord = transformWord(rawWord, punctuation, numbers);
        }

        return {
            id: `word-${i}`,
            string: rawWord,
            chars: rawWord.split(''),
        };
    });
}
