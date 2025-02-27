import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCode = async () => {
    if (!prompt.trim()) return;
    
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
      setGeneratedCode(data.code);
      
      // Auto-detect language if possible
      if (data.language) {
        setLanguage(data.language);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="app-container">
      <header>
        <h1>OpenAI Code Generator</h1>
      </header>
      
      <div className="content-container">
        {/* Input Section */}
        <div className="input-section">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want to generate..."
            rows={10}
          />
          <div className="button-group">
            <button 
              onClick={generateCode}
              disabled={isLoading}
              className="primary-button"
            >
              {isLoading ? 'Generating...' : 'Generate Code'}
            </button>
            <button 
              onClick={() => {
                setPrompt('');
                setGeneratedCode('');
                setError(null);
              }}
            >
              Clear
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {/* Output Section */}
        <div className="output-section">
          <div className="output-header">
            <h3>Generated Code</h3>
            {generatedCode && (
              <button onClick={copyToClipboard} className="copy-button">
                Copy to Clipboard
              </button>
            )}
          </div>
          <div className="code-container">
            {generatedCode ? (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers={true}
                wrapLines={true}
              >
                {generatedCode}
              </SyntaxHighlighter>
            ) : (
              <div className="placeholder-text">
                Your generated code will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 