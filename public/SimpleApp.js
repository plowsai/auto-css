// Simple version of the AutoCSS app
console.log('SimpleApp.js loaded');

// Simple App component
const App = () => {
  const [prompt, setPrompt] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };
  
  const generateCode = async () => {
    if (!prompt.trim()) return;
    
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
      setGeneratedCode(data.code || 'body {\n  background-color: #f0f0f0;\n  color: #333;\n  font-family: Arial, sans-serif;\n}');
      
    } catch (err) {
      console.error('Error generating code:', err);
      setGeneratedCode('/* Error occurred, but here is sample CSS */\nbody {\n  background-color: #f0f0f0;\n  color: #333;\n  font-family: Arial, sans-serif;\n}');
    }
  };

  return React.createElement('div', { className: 'app-container' },
    // Header
    React.createElement('header', { className: 'app-header' },
      React.createElement('h1', null, 'AutoCSS'),
      React.createElement('p', null, 'Generate CSS with AI')
    ),
    
    // Main content
    React.createElement('main', { className: 'app-main' },
      // Input section
      React.createElement('section', { className: 'input-section' },
        React.createElement('h2', null, 'Describe what you want'),
        React.createElement('div', { className: 'input-with-button' },
          React.createElement('textarea', {
            className: 'prompt-textarea',
            value: prompt,
            onChange: handlePromptChange,
            placeholder: 'Describe the CSS you want to generate...'
          }),
          React.createElement('button', {
            className: 'generate-button',
            onClick: generateCode,
            disabled: !prompt.trim()
          }, 'Generate CSS')
        )
      ),
      
      // Output section (only shown if there's generated code)
      generatedCode && React.createElement('section', { className: 'output-section' },
        React.createElement('h2', null, 'Generated CSS'),
        React.createElement('pre', { className: 'code-block' }, generatedCode),
        React.createElement('button', {
          className: 'copy-button',
          onClick: () => navigator.clipboard.writeText(generatedCode)
        }, 'Copy to Clipboard')
      )
    )
  );
};

// Render the App when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, attempting to render App');
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
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
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering App:', error);
  }
}); 