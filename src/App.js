import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState('');

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('File uploaded successfully');
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
    uploadFile(droppedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  // SVG icons for buttons
  const AttachIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ImportIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14.899V19a2 2 0 002 2h12a2 2 0 002-2v-4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v12M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const PublicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12h20M12 2a8 8 0 018 8M12 2a8 8 0 00-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <svg className="App-logo" width="50" height="50" viewBox="0 0 100 100">
            <path d="M50 15 L75 65 L25 65 Z" fill="url(#gradient)" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>Idea to app in seconds.</h1>
        <p>Lovable is your superhuman full stack engineer.</p>
        
        <div className="input-container">
          <input 
            type="text" 
            className="prompt-input" 
            placeholder="Ask Lovable to create a bl" 
            value={inputText}
            onChange={handleInputChange}
          />
          <div className="action-buttons">
            <button className="action-button">
              <AttachIcon />
              <span>Attach</span>
            </button>
            <button className="action-button">
              <ImportIcon />
              <span>Import</span>
            </button>
            <button className="action-button right">
              <PublicIcon />
              <span>Public</span>
            </button>
          </div>
        </div>

        <div className="button-group">
          <button>Weather dashboard</button>
          <button>Social media feed</button>
          <button>Personal website</button>
          <button>E-commerce store</button>
        </div>
      </header>
    </div>
  );
}

export default App; 