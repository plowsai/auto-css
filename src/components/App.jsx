import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import PromptInput from './PromptInput';
import useCodeGeneration from './hooks/useCodeGeneration';
import useLocalStorage from './hooks/useLocalStorage';

const App = () => {
  const { code, language, isLoading, error, generateCode } = useCodeGeneration();
  const [history, setHistory] = useLocalStorage('autocss-history', []);
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerateCode = async (prompt) => {
    await generateCode(prompt);
    
    // Add to history if successful
    if (code) {
      const newEntry = {
        id: Date.now(),
        prompt,
        code,
        language,
        timestamp: new Date().toISOString()
      };
      
      setHistory(prevHistory => [newEntry, ...prevHistory.slice(0, 9)]);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setActiveTab('generate');
    // Set the code from history
    generateCode(item.prompt);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AutoCSS</h1>
        <p>Generate CSS code with AI</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <main className="app-main">
        {activeTab === 'generate' ? (
          <>
            <section className="input-section">
              <h2>Describe what you want</h2>
              <PromptInput onSubmit={handleGenerateCode} isLoading={isLoading} />
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </section>

            <section className="output-section">
              <h2>Generated CSS</h2>
              <CodeEditor 
                code={code} 
                language={language} 
              />
              
              {code && (
                <div className="copy-button-container">
                  <button 
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="history-section">
            <h2>Generation History</h2>
            {history.length === 0 ? (
              <p className="no-history">No history yet. Generate some CSS to see it here.</p>
            ) : (
              <ul className="history-list">
                {history.map(item => (
                  <li key={item.id} className="history-item">
                    <div className="history-prompt">{item.prompt}</div>
                    <div className="history-meta">
                      <span className="history-language">{item.language}</span>
                      <span className="history-date">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className="history-use-button"
                      onClick={() => handleSelectHistoryItem(item)}
                    >
                      Use This
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default App; 