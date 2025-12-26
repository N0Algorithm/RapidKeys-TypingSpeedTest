/**
 * metrics.js
 * 
 * Pure functions for calculating WPM, CPM, and Accuracy.
 */

/**
 * Calculates Words Per Minute (WPM)
 * Standard definition: (All correct characters / 5) / Time in minutes
 * 
 * @param {number} correctChars - Total number of correct keystrokes
 * @param {number} timeElapsedSeconds - Time passed in seconds
 * @returns {number} - The WPM value, rounded to integer
 */
export function calculateWPM(correctChars, timeElapsedSeconds) {
    if (timeElapsedSeconds === 0) return 0;
    const minutes = timeElapsedSeconds / 60;
    // Standard word length is 5 characters
    const wpm = (correctChars / 5) / minutes;
    return Math.round(wpm);
}

/**
 * Calculates Accuracy Percentage
 * Definition: (Correct Characters / Total Attempted Characters) * 100
 * 
 * @param {number} correctChars 
 * @param {number} totalChars (correct + incorrect)
 * @returns {number} - Accuracy percentage (0-100)
 */
export function calculateAccuracy(correctChars, totalChars) {
    if (totalChars === 0) return 100;
    const accuracy = (correctChars / totalChars) * 100;
    // Return formatted to specific decimal places if needed, but returning number is safer for math
    return Math.round(accuracy);
}

/**
 * Calculates Raw CPM (Characters Per Minute)
 * 
 * @param {number} totalChars 
 * @param {number} timeElapsedSeconds 
 * @returns {number}
 */
export function calculateCPM(totalChars, timeElapsedSeconds) {
    if (timeElapsedSeconds === 0) return 0;
    const minutes = timeElapsedSeconds / 60;
    return Math.round(totalChars / minutes);
}
