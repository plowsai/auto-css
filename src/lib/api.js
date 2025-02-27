/**
 * API utility functions for the AutoCSS application
 */

/**
 * Generate CSS code using the API
 * @param {string} prompt - The prompt to send to the API
 * @returns {Promise<Object>} - The generated code and language
 */
async function generateCSS(prompt) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating CSS:', error);
    throw error;
  }
}

/**
 * Upload a file to the server
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Information about the uploaded file
 */
async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export {
  generateCSS,
  uploadFile
}; 