import { Filter } from 'bad-words';

// Initialize the profanity filter
const filter = new Filter();

// Add some additional words that might be inappropriate for a professional marketplace
const additionalWords = [
  // Add any specific words you want to filter for your marketplace context
  'scam', 'fraud', 'fake', 'stolen', 'slave',
];

filter.addWords(...additionalWords);

/**
 * Filters profanity and inappropriate content from text
 * @param text - The text to filter
 * @returns The filtered text with inappropriate words replaced with asterisks
 */
export const filterProfanity = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  return filter.clean(text);
};

/**
 * Checks if text contains profanity or inappropriate content
 * @param text - The text to check
 * @returns True if the text contains inappropriate content
 */
export const containsProfanity = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return filter.isProfane(text);
};

/**
 * Gets a list of profane words found in the text
 * @param text - The text to analyze
 * @returns Array of profane words found
 */
export const getProfaneWords = (text: string): string[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const words = text.toLowerCase().split(/\s+/);
  const profaneWords: string[] = [];
  
  words.forEach(word => {
    // Remove punctuation for checking
    const cleanWord = word.replace(/[^\w]/g, '');
    if (filter.isProfane(cleanWord)) {
      profaneWords.push(word);
    }
  });
  
  return profaneWords;
};
