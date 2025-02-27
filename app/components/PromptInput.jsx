import React, { useState } from 'react';

const PromptInput = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="prompt-input-container">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the CSS you want to generate..."
            rows={4}
            disabled={isLoading}
          />
        </div>
        <div className="button-container">
          <button 
            type="submit" 
            className="generate-button"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate CSS'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptInput; 