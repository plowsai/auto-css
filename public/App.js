// Browser-compatible version of the AutoCSS app
// This version uses global React and ReactDOM variables instead of imports

console.log('App.js loaded');

// Preview Panel Component
const PreviewPanel = ({ generatedCode, projectId }) => {
  const [previewWidth, setPreviewWidth] = React.useState('100%');
  const [previewHeight, setPreviewHeight] = React.useState('500px');
  const [previewScale, setPreviewScale] = React.useState(1);
  const iframeRef = React.useRef(null);
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Predefined device sizes
  const deviceSizes = [
    { name: 'Mobile S', width: '320px', height: '568px', scale: 0.8 },
    { name: 'Mobile M', width: '375px', height: '667px', scale: 0.8 },
    { name: 'Mobile L', width: '425px', height: '812px', scale: 0.8 },
    { name: 'Tablet', width: '768px', height: '1024px', scale: 0.7 },
    { name: 'Laptop', width: '1024px', height: '768px', scale: 0.6 },
    { name: 'Desktop', width: '1440px', height: '900px', scale: 0.5 },
    { name: 'Full Width', width: '100%', height: '500px', scale: 1 }
  ];

  // Generate preview HTML with the CSS
  React.useEffect(() => {
    if (generatedCode) {
      generatePreview();
    }
  }, [generatedCode, projectId]);

  const generatePreview = async () => {
    setIsLoading(true);
    
    try {
      // If we have a projectId, try to get a preview from the server
      if (projectId) {
        const response = await fetch(`/api/preview/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setPreviewUrl(`/preview/${projectId}`);
          setIsLoading(false);
          return;
        }
      }
      
      // Otherwise, create a data URL with the generated CSS
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CSS Preview</title>
          <style>
            ${generatedCode}
          </style>
        </head>
        <body>
          <div class="preview-container">
            <header>
              <h1>Preview Header</h1>
              <nav>
                <ul>
                  <li><a href="#">Home</a></li>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Services</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </nav>
            </header>
            <main>
              <section class="hero">
                <h2>Welcome to the Preview</h2>
                <p>This is a preview of your generated CSS.</p>
                <button class="cta-button">Call to Action</button>
              </section>
              <section class="features">
                <div class="feature-card">
                  <h3>Feature 1</h3>
                  <p>Description of feature 1</p>
                </div>
                <div class="feature-card">
                  <h3>Feature 2</h3>
                  <p>Description of feature 2</p>
                </div>
                <div class="feature-card">
                  <h3>Feature 3</h3>
                  <p>Description of feature 3</p>
                </div>
              </section>
            </main>
            <footer>
              <p>&copy; 2023 Preview Site</p>
            </footer>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceSelect = (device) => {
    setPreviewWidth(device.width);
    setPreviewHeight(device.height);
    setPreviewScale(device.scale);
  };

  return React.createElement('div', { className: 'preview-panel' },
    React.createElement('h2', null, 'Preview'),
    React.createElement('div', { className: 'device-selector' },
      deviceSizes.map(device => 
        React.createElement('button', {
          key: device.name,
          className: `device-button ${previewWidth === device.width ? 'active' : ''}`,
          onClick: () => handleDeviceSelect(device)
        }, device.name)
      )
    ),
    React.createElement('div', { className: 'preview-container', style: { maxWidth: '100%', overflow: 'auto' } },
      isLoading 
        ? React.createElement('div', { className: 'preview-loading' }, 'Loading preview...')
        : React.createElement('div', { 
            className: 'iframe-container',
            style: { 
              width: previewWidth === '100%' ? '100%' : 'auto',
              height: 'auto',
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              border: '1px solid #333',
              borderRadius: '4px',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }
          },
          React.createElement('iframe', {
            ref: iframeRef,
            src: previewUrl,
            style: {
              width: previewWidth,
              height: previewHeight,
              border: 'none',
              display: 'block'
            },
            title: 'CSS Preview'
          })
        )
    ),
    React.createElement('div', { className: 'preview-info' },
      React.createElement('p', null, `Current size: ${previewWidth} × ${previewHeight}`)
    )
  );
};

// Main App component
const App = () => {
  console.log('App component rendering');
  const [prompt, setPrompt] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [language, setLanguage] = React.useState('css');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [projectId, setProjectId] = React.useState(null);
  const [downloadUrl, setDownloadUrl] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [history, setHistory] = React.useState(() => {
    try {
      const savedHistory = localStorage.getItem('autocss-history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('Error loading history from localStorage:', e);
      return [];
    }
  });
  const [activeTab, setActiveTab] = React.useState('generate');
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);

  // Save history to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('autocss-history', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
  }, [history]);

  // Show preview when code is generated
  React.useEffect(() => {
    if (generatedCode) {
      setShowPreview(true);
    }
  }, [generatedCode]);

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFolderClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Upload the file
      uploadFile(file);
    }
  };

  const handleFolderChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Upload the folder (multiple files)
      uploadFolder(files);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsLoading(true);
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      console.log('File uploaded:', data);
      setProjectId(null); // Reset project ID as this is a single file
      
    } catch (err) {
      setError(err.message);
      console.error('Error uploading file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFolder = async (files) => {
    const formData = new FormData();
    
    // Append all files to the form data
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/upload-folder', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload folder');
      }
      
      const data = await response.json();
      console.log('Folder uploaded:', data);
      setProjectId(data.projectId);
      
    } catch (err) {
      setError(err.message);
      console.error('Error uploading folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
        body: JSON.stringify({ 
          prompt,
          projectId // Include projectId if available
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate code');
      }
      
      const data = await response.json();
      setGeneratedCode(data.code || 'body {\n  background-color: #f0f0f0;\n  color: #333;\n  font-family: Arial, sans-serif;\n}');
      
      // Set download URL if available
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
      }
      
      // Auto-detect language if possible
      if (data.language) {
        setLanguage(data.language);
      }

      // Add to history if successful
      const newEntry = {
        id: Date.now(),
        prompt,
        code: data.code || 'body {\n  background-color: #f0f0f0;\n  color: #333;\n  font-family: Arial, sans-serif;\n}',
        language: data.language || 'css',
        timestamp: new Date().toISOString(),
        downloadUrl: data.downloadUrl
      };
      
      setHistory(prevHistory => [newEntry, ...prevHistory.slice(0, 9)]);
    } catch (err) {
      setError(err.message);
      // For testing, still show some code even if there's an error
      setGeneratedCode('/* Error occurred, but here is sample CSS */\nbody {\n  background-color: #f0f0f0;\n  color: #333;\n  font-family: Arial, sans-serif;\n}');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setActiveTab('generate');
    setPrompt(item.prompt);
    setGeneratedCode(item.code);
    setLanguage(item.language);
    setDownloadUrl(item.downloadUrl);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard!');
  };

  const downloadProject = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return React.createElement('div', { className: 'app-container' },
    // Header
    React.createElement('header', { className: 'app-header' },
      React.createElement('h1', null, 'Responsive CSS in seconds.'),
      React.createElement('p', null, 'AutoCSS is your magical CSS generator.')
    ),
    
    // Tabs
    React.createElement('div', { className: 'tabs' },
      React.createElement('button', { 
        className: `tab ${activeTab === 'generate' ? 'active' : ''}`,
        onClick: () => setActiveTab('generate')
      }, 'Generate'),
      React.createElement('button', { 
        className: `tab ${activeTab === 'history' ? 'active' : ''}`,
        onClick: () => setActiveTab('history')
      }, 'History')
    ),
    
    // Main content
    React.createElement('main', { className: 'app-main' },
      activeTab === 'generate' ? 
        // Generate tab
        React.createElement('div', { 
          className: `content-layout ${generatedCode ? 'with-output' : ''}` 
        },
          // Input section
          React.createElement('section', { className: 'input-section' },
            React.createElement('h2', null, 'Describe what you want'),
            React.createElement('div', { className: 'prompt-input-container' },
              React.createElement('form', { 
                onSubmit: (e) => {
                  e.preventDefault();
                  generateCode();
                }
              },
                React.createElement('div', { className: 'input-group' },
                  React.createElement('div', { className: 'input-with-button' },
                    React.createElement('textarea', {
                      className: 'prompt-textarea',
                      value: prompt,
                      onChange: (e) => setPrompt(e.target.value),
                      placeholder: 'Upload a project to Auto CSS',
                      rows: 4,
                      disabled: isLoading
                    }),
                    React.createElement('button', {
                      type: 'button',
                      className: 'upload-button-inside',
                      onClick: handleAttachClick
                    }, 'Upload File'),
                    React.createElement('input', {
                      ref: fileInputRef,
                      type: 'file',
                      style: { display: 'none' },
                      onChange: handleFileChange
                    }),
                    // Add folder input
                    React.createElement('button', {
                      type: 'button',
                      className: 'upload-folder-button',
                      onClick: handleFolderClick
                    }, 'Upload Folder'),
                    React.createElement('input', {
                      ref: folderInputRef,
                      type: 'file',
                      webkitdirectory: "", // This attribute enables folder selection
                      directory: "", // Non-standard attribute for Firefox
                      multiple: true,
                      style: { display: 'none' },
                      onChange: handleFolderChange
                    }),
                    React.createElement('button', {
                      type: 'submit',
                      className: 'generate-button',
                      disabled: isLoading || !prompt.trim()
                    }, isLoading ? 'Generating...' : 'Generate')
                  )
                )
              )
            ),
            error && React.createElement('div', { className: 'error-message' }, error)
          ),
          
          // Output section (always show if there's generated code)
          generatedCode && React.createElement('section', { className: 'output-section' },
            React.createElement('div', { className: 'output-tabs' },
              React.createElement('button', {
                className: `output-tab ${!showPreview ? 'active' : ''}`,
                onClick: () => setShowPreview(false)
              }, 'Code'),
              React.createElement('button', {
                className: `output-tab ${showPreview ? 'active' : ''}`,
                onClick: () => setShowPreview(true)
              }, 'Preview')
            ),
            !showPreview ? (
              // Code view
              React.createElement(React.Fragment, null,
                React.createElement('h2', null, 'Generated CSS'),
                React.createElement('div', { className: 'code-editor-container' },
                  React.createElement('div', { className: 'code-editor-header' },
                    React.createElement('span', { className: 'language-badge' }, language || 'css')
                  ),
                  React.createElement('textarea', {
                    className: 'code-editor',
                    value: generatedCode,
                    readOnly: true,
                    spellCheck: 'false',
                    'aria-label': 'Code editor'
                  })
                ),
                React.createElement('div', { className: 'action-buttons-container' },
                  React.createElement('button', {
                    className: 'copy-button',
                    onClick: copyToClipboard
                  }, 'Copy to Clipboard'),
                  downloadUrl && React.createElement('button', {
                    className: 'download-button',
                    onClick: downloadProject
                  }, 'Download Project')
                )
              )
            ) : (
              // Preview view
              React.createElement(PreviewPanel, {
                generatedCode: generatedCode,
                projectId: projectId
              })
            )
          )
        ) :
        // History tab
        React.createElement('section', { className: 'history-section' },
          React.createElement('h2', null, 'Generation History'),
          history.length === 0 ?
            React.createElement('p', { className: 'no-history' }, 'No history yet. Generate some CSS to see it here.') :
            React.createElement('ul', { className: 'history-list' },
              history.map(item => 
                React.createElement('li', { key: item.id, className: 'history-item' },
                  React.createElement('div', { className: 'history-prompt' }, item.prompt),
                  React.createElement('div', { className: 'history-meta' },
                    React.createElement('span', { className: 'history-language' }, item.language),
                    React.createElement('span', { className: 'history-date' },
                      new Date(item.timestamp).toLocaleDateString()
                    )
                  ),
                  React.createElement('div', { className: 'history-actions' },
                    React.createElement('button', {
                      className: 'history-use-button',
                      onClick: () => handleSelectHistoryItem(item)
                    }, 'Use This'),
                    item.downloadUrl && React.createElement('button', {
                      className: 'history-download-button',
                      onClick: () => { window.location.href = item.downloadUrl; }
                    }, 'Download')
                  )
                )
              )
            )
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