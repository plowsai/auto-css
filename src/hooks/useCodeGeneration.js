import { useState } from 'react';

/**
 * Custom hook for handling code generation API requests
 * @returns {Object} - Functions and state for code generation
 */
const useCodeGeneration = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('css');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate code based on the provided prompt
   * @param {string} prompt - The prompt to send to the API
   */
  const generateCode = async (prompt) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate code');
      }
      
      const data = await response.json();
      setCode(data.code);
      setLanguage(data.language);
    } catch (err) {
      setError(err.message || 'An error occurred while generating code');
      console.error('Error generating code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    code,
    language,
    isLoading,
    error,
    generateCode,
    setCode,
  };
};

export default useCodeGeneration; 