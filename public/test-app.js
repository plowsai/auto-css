// AutoCSS App - Modern UI version
console.log('AutoCSS App loaded');

// Simple App component
const App = () => {
  const [prompt, setPrompt] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('generate'); // 'generate', 'history'
  const [history, setHistory] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Generate CSS code
  const generateCode = () => {
    if (!prompt.trim() && !selectedFile) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCode = `/* Generated CSS for: ${prompt} */
body {
  background-color: #f0f0f0;
  color: #333;
  font-family: 'Inter', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

button {
  background-color: #4361ee;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3a56d4;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}`;
      
      setGeneratedCode(newCode);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        prompt: prompt,
        code: newCode,
        timestamp: new Date().toISOString()
      };
      
      setHistory(prev => [newHistoryItem, ...prev]);
      setIsLoading(false);
    }, 1500);
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // You could read the file here if needed
      setPrompt(`Make responsive CSS for the uploaded file: ${file.name}`);
    }
  };
  
  // Handle folder upload
  const handleFolderUpload = (event) => {
    // In a real implementation, this would handle folder uploads
    alert('Folder upload functionality would be implemented here');
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setPrompt(`Make responsive CSS for the uploaded file: ${e.dataTransfer.files[0].name}`);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('CSS copied to clipboard!');
  };
  
  // Download CSS
  const downloadCSS = () => {
    const blob = new Blob([generatedCode], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autocss-generated.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Select history item
  const selectHistoryItem = (item) => {
    setGeneratedCode(item.code);
    setPrompt(item.prompt);
    setActiveTab('generate');
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return React.createElement('div', { className: 'app-container' },
    // Header with title
    React.createElement('header', { className: 'app-header' },
      React.createElement('h1', { className: 'main-title' }, 'Responsive CSS in seconds.'),
      React.createElement('p', { className: 'tagline' }, 'AutoCSS is your magical CSS generator.')
    ),
    
    // Tab navigation
    React.createElement('div', { className: 'tab-navigation' },
      React.createElement('button', {
        className: `tab-button ${activeTab === 'generate' ? 'active' : ''}`,
        onClick: () => setActiveTab('generate')
      }, 'Generate'),
      React.createElement('button', {
        className: `tab-button ${activeTab === 'history' ? 'active' : ''}`,
        onClick: () => setActiveTab('history')
      }, 'History')
    ),
    
    // Main content
    React.createElement('main', { className: 'main-content' },
      activeTab === 'generate' ? 
        // Generate tab
        React.createElement('div', { className: 'generate-container' },
          React.createElement('div', { 
            className: 'upload-container',
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop
          },
            React.createElement('div', { className: 'upload-content' },
              React.createElement('textarea', {
                className: 'prompt-input',
                value: prompt,
                onChange: (e) => setPrompt(e.target.value),
                placeholder: 'Upload a project to Auto CSS',
                rows: 1
              }),
              React.createElement('div', { className: 'upload-buttons' },
                React.createElement('div', { className: 'left-buttons' },
                  React.createElement('input', {
                    type: 'file',
                    id: 'file-upload',
                    onChange: handleFileUpload,
                    accept: '.html,.htm',
                    style: { display: 'none' }
                  }),
                  React.createElement('label', { 
                    htmlFor: 'file-upload',
                    className: 'upload-button'
                  }, 'Upload File'),
                  React.createElement('button', {
                    className: 'upload-button',
                    onClick: handleFolderUpload
                  }, 'Upload Folder')
                ),
                React.createElement('button', {
                  className: 'generate-button',
                  onClick: generateCode,
                  disabled: isLoading
                }, isLoading ? 'Generating...' : 'Generate')
              )
            )
          ),
          
          // Output section (hidden until we have generated code)
          generatedCode && React.createElement('div', { className: 'output-section' },
            React.createElement('div', { className: 'output-header' },
              React.createElement('h3', null, 'Generated CSS'),
              React.createElement('div', { className: 'output-actions' },
                React.createElement('button', {
                  className: 'action-button copy-button',
                  onClick: copyToClipboard
                }, 'Copy'),
                React.createElement('button', {
                  className: 'action-button download-button',
                  onClick: downloadCSS
                }, 'Download')
              )
            ),
            React.createElement('div', { className: 'code-container' },
              React.createElement('pre', { className: 'code-block' }, generatedCode)
            )
          )
        ) :
        
        // History tab
        React.createElement('div', { className: 'history-container' },
          history.length > 0 ?
            React.createElement('div', { className: 'history-list' },
              history.map(item => 
                React.createElement('div', { 
                  key: item.id,
                  className: 'history-item'
                },
                  React.createElement('div', { className: 'history-item-header' },
                    React.createElement('p', { className: 'history-prompt' }, item.prompt),
                    React.createElement('span', { className: 'history-date' }, formatDate(item.timestamp))
                  ),
                  React.createElement('div', { className: 'history-actions' },
                    React.createElement('button', {
                      className: 'history-button use-button',
                      onClick: () => selectHistoryItem(item)
                    }, 'Use This'),
                    React.createElement('button', {
                      className: 'history-button download-button',
                      onClick: () => {
                        setGeneratedCode(item.code);
                        downloadCSS();
                      }
                    }, 'Download')
                  )
                )
              )
            ) :
            React.createElement('div', { className: 'empty-history' },
              React.createElement('p', null, 'No history yet'),
              React.createElement('p', { className: 'empty-hint' }, 'Generate some CSS to see your history here')
            )
        )
    )
  );
};

// Add CSS styles
const styles = `
  :root {
    --primary-color: #4361ee;
    --primary-hover: #3a56d4;
    --background-dark: #000000;
    --background-card: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --border-color: #333333;
    --success-color: #4caf50;
    --tab-active-border: #6366f1;
  }
  
  body {
    background-color: var(--background-dark);
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .app-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--text-primary);
  }
  
  .app-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .main-title {
    font-size: 4rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }
  
  .tagline {
    font-size: 1.5rem;
    margin: 1rem 0 0;
    color: var(--text-secondary);
    font-weight: 400;
  }
  
  .tab-navigation {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #333;
  }
  
  .tab-button {
    background: transparent;
    color: var(--text-secondary);
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;
  }
  
  .tab-button.active {
    color: var(--text-primary);
    border-bottom: 3px solid var(--tab-active-border);
    font-weight: 600;
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .upload-container {
    background-color: rgba(30, 30, 30, 0.5);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .prompt-input {
    background-color: transparent;
    color: var(--text-primary);
    border: none;
    font-size: 1.5rem;
    resize: none;
    padding: 0;
    font-family: inherit;
    width: 100%;
  }
  
  .prompt-input:focus {
    outline: none;
  }
  
  .upload-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .left-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .upload-button {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    display: inline-block;
    text-align: center;
  }
  
  .upload-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  .generate-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .generate-button:hover {
    background-color: var(--primary-hover);
  }
  
  .generate-button:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
  }
  
  .output-section {
    background-color: var(--background-card);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 2rem;
  }
  
  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .output-header h3 {
    margin: 0;
  }
  
  .output-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .code-container {
    padding: 1rem;
    overflow: auto;
    background-color: #282c34;
    max-height: 500px;
  }
  
  .code-block {
    margin: 0;
    white-space: pre-wrap;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    color: #d4d4d4;
  }
  
  .history-container {
    background-color: var(--background-card);
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .history-item {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s;
  }
  
  .history-item:hover {
    border-color: var(--primary-color);
  }
  
  .history-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .history-prompt {
    margin: 0;
    font-weight: 500;
  }
  
  .history-date {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  
  .history-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .history-button {
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }
  
  .history-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .use-button {
    color: var(--primary-color);
    border-color: var(--primary-color);
  }
  
  .empty-history {
    text-align: center;
    padding: 3rem 0;
    color: var(--text-secondary);
  }
  
  .empty-hint {
    font-size: 0.9rem;
    opacity: 0.7;
  }
  
  @media (max-width: 768px) {
    .app-container {
      padding: 1rem;
    }
    
    .main-title {
      font-size: 2.5rem;
    }
    
    .tagline {
      font-size: 1.2rem;
    }
    
    .upload-buttons {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .left-buttons {
      justify-content: space-between;
    }
  }
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

// Render the App when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, attempting to render AutoCSS App');
  const rootElement = document.getElementById('root');
  
  try {
    // Check if createRoot is available (React 18+)
    if (ReactDOM.createRoot) {
      console.log('Using React 18 createRoot method');
      const root = ReactDOM.createRoot(rootElement);
      root.render(React.createElement(App));
    } else {
      // Fallback to older render method
      console.log('Using legacy ReactDOM.render method');
      ReactDOM.render(React.createElement(App), rootElement);
    }
    console.log('AutoCSS App rendered successfully');
  } catch (error) {
    console.error('Error rendering AutoCSS App:', error);
  }
}); 