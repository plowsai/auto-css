import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);

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

  return (
    <div className="App">
      <header className="App-header">
        <img src="/path/to/logo.png" alt="Logo" className="App-logo" />
        <h1>Idea to app in seconds.</h1>
        <p>Lovable is your superhuman full stack engineer.</p>
        <div
          className="drop-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? <p>{file.name}</p> : <p>Drag and drop a file here</p>}
        </div>
        <input type="file" onChange={handleFileChange} />
        <div className="button-group">
          <button>Job board</button>
          <button>Weather dashboard</button>
          <button>Expense tracker</button>
          <button>Markdown editor</button>
        </div>
      </header>
    </div>
  );
}

export default App; 