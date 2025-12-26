/**
 * quotes.js
 * 
 * Monkeytype-style quote dataset for Quotes Mode.
 * Quotes are categorized by character length:
 * - Short: 80-160 characters
 * - Medium: 160-300 characters
 * - Long: 300-600+ characters
 * 
 * All quotes preserve original punctuation, capitalization, and spacing.
 */

const QUOTES = {
    short: [
        "The secret of getting ahead is getting started.",
        "Be yourself; everyone else is already taken.",
        "Whatever you are, be a good one.",
        "The only way to do great work is to love what you do.",
        "Get busy living or get busy dying.",
        "Everything you can imagine is real.",
        "You miss 100% of the shots you don't take.",
        "Believe you can and you're halfway there.",
        "In order to write about life first you must live it.",
        "Not how long, but how well you have lived is the main thing.",
        "It does not matter how slowly you go as long as you do not stop.",
        "The big lesson in life is never be scared of anyone or anything.",
        "Do what you can, with what you have, where you are.",
        "Be the change that you wish to see in the world.",
        "Life is not a problem to be solved, but a reality to be experienced.",
        "A person who never made a mistake never tried anything new.",
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "It is during our darkest moments that we must focus to see the light.",
        "The mind is everything. What you think you become.",
        "Happiness is not something ready made. It comes from your own actions."
    ],
    medium: [
        "Success is not final, failure is not fatal: it is the courage to continue that counts. What we think, we become.",
        "If you want to live a happy life, tie it to a goal, not to people or things. The journey of a thousand miles begins with one step.",
        "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma, which is living with the results of other people's thinking.",
        "Many of life's failures are people who did not realize how close they were to success when they gave up. Our greatest glory is not in never falling, but in rising every time we fall.",
        "You only live once, but if you do it right, once is enough. Life is what happens when you're busy making other plans.",
        "Money and success don't change people; they merely amplify what is already there. Be who you are and say what you feel, because those who mind don't matter and those who matter don't mind.",
        "The whole secret of a successful life is to find out what is one's destiny to do, and then do it. In the end, it's not the years in your life that count. It's the life in your years.",
        "I have not failed. I've just found 10,000 ways that won't work. Genius is one percent inspiration and ninety-nine percent perspiration.",
        "He who has a why to live can bear almost any how. That which does not kill us makes us stronger.",
        "Do not go where the path may lead, go instead where there is no path and leave a trail. The only person you are destined to become is the person you decide to be.",
        "Whether you think you can or you think you can't, you're right. The best preparation for tomorrow is doing your best today.",
        "Curiosity about life in all of its aspects, I think, is still the secret of great creative people. Creativity is intelligence having fun.",
        "If life were predictable it would cease to be life, and be without flavor. The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate.",
        "Life is a journey, not a destination. The way to get started is to quit talking and begin doing.",
        "When one door of happiness closes, another opens; but often we look so long at the closed door that we do not see the one which has been opened for us."
    ],
    long: [
        "In the middle of every difficulty lies opportunity. What we think, we become. The only limit to our realization of tomorrow is our doubts of today. Let us not look back in anger, nor forward in fear, but around in awareness. The future belongs to those who believe in the beauty of their dreams.",
        "The greatest glory in living lies not in never falling, but in rising every time we fall. Life is what happens when you're busy making other plans. The purpose of our lives is to be happy. Get busy living or get busy dying. You only live once, but if you do it right, once is enough. Many of life's failures are people who did not realize how close they were to success when they gave up.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. It is during our darkest moments that we must focus to see the light. The only impossible journey is the one you never begin. Life is either a daring adventure or nothing at all. In three words I can sum up everything I've learned about life: it goes on. The best and most beautiful things in the world cannot be seen or even touched, they must be felt with the heart.",
        "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover. The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
        "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well. Life is not measured by the number of breaths we take, but by the moments that take our breath away. In the end, it's not the years in your life that count. It's the life in your years.",
        "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.",
        "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face. You are able to say to yourself, 'I lived through this horror. I can take the next thing that comes along.' You must do the thing you think you cannot do. The only thing we have to fear is fear itself.",
        "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that. I have decided to stick with love. Hate is too great a burden to bear. The time is always right to do what is right. Our lives begin to end the day we become silent about things that matter."
    ]
};

/**
 * Selects a random quote from the specified length category.
 * @param {'short' | 'medium' | 'long'} lengthType - The quote length category.
 * @returns {string} - A random quote string.
 */
function selectQuote(lengthType) {
    const pool = QUOTES[lengthType] || QUOTES.medium;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Transforms a quote string into the typing engine's word structure.
 * Preserves all punctuation and capitalization.
 * @param {string} quoteText - The raw quote string.
 * @returns {Array<Object>} - Array of word objects for the typing engine.
 */
function parseQuoteToWords(quoteText) {
    // Split by spaces but preserve all punctuation
    const rawWords = quoteText.split(' ').filter(w => w.length > 0);

    return rawWords.map((wordStr, i) => ({
        id: `quote-${i}`,
        string: wordStr,
        chars: wordStr.split('')
    }));
}

/**
 * Generates words for a quote of the specified length.
 * @param {'short' | 'medium' | 'long'} lengthType - The quote length category.
 * @returns {Array<Object>} - Array of word objects for the typing engine.
 */
export function generateQuote(lengthType = 'medium') {
    // Normalize lengthType
    const validTypes = ['short', 'medium', 'long'];
    const normalizedType = validTypes.includes(lengthType) ? lengthType : 'medium';

    const quoteText = selectQuote(normalizedType);
    return parseQuoteToWords(quoteText);
}

/**
 * Returns metadata about quote lengths for UI display.
 */
export const QUOTE_LENGTHS = {
    short: { label: 'Short', description: '80-160 chars', approxTime: '10-20s' },
    medium: { label: 'Medium', description: '160-300 chars', approxTime: '20-40s' },
    long: { label: 'Long', description: '300-600+ chars', approxTime: '45-90s' }
};
