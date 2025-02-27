/**
 * Collection of utility functions for the AutoCSS application
 */

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - The date to format
 * @returns {string} - The formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Copy text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - Whether the copy was successful
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

/**
 * Extract CSS properties from a string of CSS
 * @param {string} css - The CSS string to parse
 * @returns {Object} - An object with property names as keys and values as values
 */
function extractCSSProperties(css) {
  const properties = {};
  const regex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
  let match;
  
  while ((match = regex.exec(css)) !== null) {
    properties[match[1]] = match[2].trim();
  }
  
  return properties;
}

module.exports = {
  debounce,
  formatDate,
  copyToClipboard,
  extractCSSProperties
}; 