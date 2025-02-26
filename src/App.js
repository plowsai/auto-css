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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Drag and Drop App</h1>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ width: '300px', height: '200px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}
        >
          {file ? <p>{file.name}</p> : <p>Drag and drop a file here</p>}
        </div>
      </header>
    </div>
  );
}

export default App; 