// AutoCSS App - Modern UI version
console.log('AutoCSS App loaded');

// Test app for AutoCSS Mobile CSS Generator
// This app demonstrates the mobile CSS generation functionality

// Main App component
const App = () => {
  const [url, setUrl] = React.useState('https://example.com');
  const [activeTab, setActiveTab] = React.useState('preview'); // 'preview' or 'generate'
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const previewIframeRef = React.useRef(null);
  const [isAlreadyOptimized, setIsAlreadyOptimized] = React.useState(false);
  
  // Handle URL input change
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };
  
  // Handle URL form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate URL
      let processedUrl = url.trim();
      
      // Add https:// if no protocol is specified
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
        setUrl(processedUrl);
      }
      
      // Reset the isAlreadyOptimized state when loading a new URL
      setIsAlreadyOptimized(false);
      
      // Set the URL and wait for the iframe to load
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading URL:', err);
      setError('Failed to load the URL. Please check the URL and try again.');
      setIsLoading(false);
    }
  };
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Update isAlreadyOptimized state
  const updateOptimizationStatus = (status) => {
    setIsAlreadyOptimized(status);
  };
  
  return React.createElement('div', { className: 'app-container' },
    // Header
    React.createElement('header', { className: 'app-header' },
      React.createElement('h1', null, 'AutoCSS Mobile Preview'),
      React.createElement('p', null, 'Generate mobile-responsive CSS with OpenAI')
    ),
    
    // URL Input Form
    React.createElement('form', { className: 'url-form', onSubmit: handleSubmit },
      React.createElement('input', {
        type: 'text',
        value: url,
        onChange: handleUrlChange,
        placeholder: 'Enter website URL (e.g., https://example.com)',
        className: 'url-input'
      }),
      React.createElement('button', {
        type: 'submit',
        className: 'load-button',
        disabled: isLoading
      }, isLoading ? 'Loading...' : 'Load Website')
    ),
    
    // Error message
    error && React.createElement('div', { className: 'error-message' }, error),
    
    // Tabs
    React.createElement('div', { className: 'tabs' },
      React.createElement('button', {
        className: `tab-button ${activeTab === 'preview' ? 'active' : ''}`,
        onClick: () => handleTabChange('preview')
      }, 'Preview'),
      React.createElement('button', {
        className: `tab-button ${activeTab === 'generate' ? 'active' : ''}`,
        onClick: () => handleTabChange('generate')
      }, 'Generate Mobile CSS')
    ),
    
    // Tab content
    React.createElement('div', { className: 'tab-content' },
      // Preview Tab
      activeTab === 'preview' && React.createElement(ResponsivePreview, {
        url: url,
        ref: (el) => { previewIframeRef.current = el?.iframeRef?.current; },
        onOptimizationCheck: updateOptimizationStatus
      }),
      
      // Generate Tab
      activeTab === 'generate' && React.createElement(MobileCSSGenerator, {
        url: url,
        previewIframeRef: previewIframeRef,
        isAlreadyOptimized: isAlreadyOptimized
      })
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