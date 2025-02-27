import React, { useState, useRef } from 'react';
import FileUploader from './FileUploader';
import './ProjectProcessor.css';

function ProjectProcessor() {
  const [projectId, setProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [generatedCSS, setGeneratedCSS] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('original');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const previewIframeRef = useRef(null);

  const handleUploadComplete = (data) => {
    setProjectId(data.projectId);
    setProjectData(data.projectData);
    setError(null);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setError(null);
  };

  const handleUploadError = (errorMsg) => {
    setError(errorMsg);
    setIsUploading(false);
  };

  const generateCSS = async () => {
    if (!projectId) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-css', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate CSS');
      }
      
      const data = await response.json();
      setGeneratedCSS(data.css);
      setDownloadUrl(data.downloadUrl);
      
      // Switch to enhanced tab
      setActiveTab('enhanced');
    } catch (err) {
      setError(err.message || 'Error generating CSS');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetProject = () => {
    setProjectId(null);
    setProjectData(null);
    setGeneratedCSS('');
    setDownloadUrl(null);
    setActiveTab('original');
    setError(null);
  };

  const renderProjectInfo = () => {
    if (!projectData) return null;
    
    return (
      <div className="project-info">
        <h3>Project Analysis</h3>
        <div className="info-grid">
          <div>
            <strong>HTML Files:</strong>
            <ul>
              {projectData.htmlFiles.map((file, index) => (
                <li key={`html-${index}`}>{file}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>CSS Files:</strong>
            <ul>
              {projectData.cssFiles.length ? 
                projectData.cssFiles.map((file, index) => (
                  <li key={`css-${index}`}>{file}</li>
                )) : 
                <li>No CSS files found</li>
              }
            </ul>
          </div>
          <div>
            <strong>Elements:</strong>
            <p>Classes: {projectData.elements.classes.length}</p>
            <p>IDs: {projectData.elements.ids.length}</p>
          </div>
        </div>
      </div>
    );
  };

  const loadPreview = () => {
    if (!previewIframeRef.current || !projectId) return;
    
    const iframe = previewIframeRef.current;
    
    if (activeTab === 'original') {
      // This is a simplified approach - in a real app, you would serve the original files
      iframe.src = `/preview/${projectId}/index.html`;
    } else if (activeTab === 'enhanced') {
      // Load the enhanced version
      iframe.src = `/preview/${projectId}/index.html`;
    }
  };

  // Load preview when tab changes or projectId is set
  React.useEffect(() => {
    loadPreview();
  }, [activeTab, projectId]);

  return (
    <div className="project-processor">
      {!projectId ? (
        <div className="upload-container">
          <h2>Upload Your Project Folder</h2>
          <p>Select a folder containing your HTML, CSS, and JavaScript files to enhance with AI-generated styles.</p>
          <FileUploader 
            onUploadComplete={handleUploadComplete} 
            onUploadStart={handleUploadStart}
            onUploadError={handleUploadError}
            isUploading={isUploading}
          />
        </div>
      ) : (
        <div className="project-container">
          <div className="actions-panel">
            {renderProjectInfo()}
            
            <div className="action-buttons">
              <button 
                className="generate-button"
                onClick={generateCSS}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating CSS...' : 'Generate CSS with AI'}
              </button>
              
              {downloadUrl && (
                <a 
                  href={downloadUrl} 
                  className="download-button"
                  download="enhanced-project.zip"
                >
                  Download Enhanced Project
                </a>
              )}
              
              <button 
                className="reset-button"
                onClick={resetProject}
              >
                Start Over
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="preview-panel">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'original' ? 'active' : ''}`}
                onClick={() => setActiveTab('original')}
              >
                Original
              </button>
              <button 
                className={`tab ${activeTab === 'enhanced' ? 'active' : ''}`}
                onClick={() => setActiveTab('enhanced')}
                disabled={!generatedCSS}
              >
                Enhanced
              </button>
              <button 
                className={`tab ${activeTab === 'css' ? 'active' : ''}`}
                onClick={() => setActiveTab('css')}
                disabled={!generatedCSS}
              >
                Generated CSS
              </button>
            </div>
            
            <div className="preview-content">
              {activeTab === 'css' ? (
                <div className="css-preview">
                  <pre>{generatedCSS || 'No CSS generated yet'}</pre>
                </div>
              ) : (
                <div className="iframe-container">
                  <iframe 
                    ref={previewIframeRef}
                    title="Project Preview"
                    className="preview-iframe"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectProcessor; 