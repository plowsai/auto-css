// MobileCSSGenerator component for AutoCSS
// This component allows users to generate mobile-responsive CSS for a website

const MobileCSSGenerator = ({ projectId, url, previewIframeRef, isAlreadyOptimized }) => {
  const [generatedCSS, setGeneratedCSS] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedDevice, setSelectedDevice] = React.useState(DEVICE_PRESETS[2]); // Default to Mobile L
  const [orientation, setOrientation] = React.useState('portrait');
  const [optimizationLevel, setOptimizationLevel] = React.useState('standard');
  const [cssAnalysis, setCssAnalysis] = React.useState(null);
  const [showCSSCode, setShowCSSCode] = React.useState(false);
  
  // Generate mobile CSS
  const generateMobileCSS = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedCSS('');
    setCssAnalysis(null);
    
    // If site is already optimized and user selected minimal optimization, show message
    if (isAlreadyOptimized && optimizationLevel === 'minimal') {
      setTimeout(() => {
        setIsGenerating(false);
        setGeneratedCSS('/* This site appears to be already well-optimized for mobile devices! */\n\n/* No additional CSS modifications necessary for basic mobile compatibility. */');
        setCssAnalysis({
          status: 'perfect',
          message: 'This site is already well-optimized for mobile devices! No additional CSS needed for basic compatibility.',
          mediaQueries: 'N/A',
          flexboxUsage: 'N/A',
          gridUsage: 'N/A',
          touchProperties: 'N/A',
          viewportUnits: 'N/A'
        });
      }, 1500);
      return;
    }
    
    try {
      // Get dimensions based on selected device and orientation
      const dimensions = orientation === 'portrait' 
        ? { width: selectedDevice.width, height: selectedDevice.height }
        : { width: selectedDevice.height, height: selectedDevice.width };
      
      // Prepare the request data
      const requestData = {
        url,
        projectId,
        deviceName: selectedDevice.name,
        width: dimensions.width,
        height: dimensions.height,
        orientation,
        pixelRatio: window.devicePixelRatio || 2,
        optimizationLevel,
        isAlreadyOptimized: !!isAlreadyOptimized
      };
      
      // Call the API to generate mobile CSS
      const endpoint = projectId ? '/api/generate-mobile-css' : '/api/generate-mobile-css-for-url';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.css) {
        setGeneratedCSS(data.css);
        
        // Analyze the generated CSS
        const analysis = analyzeCss(data.css);
        setCssAnalysis(analysis);
        
        // Apply the CSS to the preview iframe if available
        if (previewIframeRef && previewIframeRef.current) {
          applyCSS();
        }
      } else {
        throw new Error('No CSS was generated');
      }
    } catch (err) {
      console.error('Error generating mobile CSS:', err);
      setError(err.message || 'Failed to generate mobile CSS');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Analyze the generated CSS
  const analyzeCss = (css) => {
    // Count media queries
    const mediaQueryMatches = css.match(/@media/g);
    const mediaQueryCount = mediaQueryMatches ? mediaQueryMatches.length : 0;
    
    // Count flexbox usage
    const flexboxMatches = css.match(/display\s*:\s*flex/g);
    const flexboxCount = flexboxMatches ? flexboxMatches.length : 0;
    
    // Count grid usage
    const gridMatches = css.match(/display\s*:\s*grid/g);
    const gridCount = gridMatches ? gridMatches.length : 0;
    
    // Check for touch-friendly properties
    const hasTouchProperties = /touch-action|tap-highlight-color|user-select/.test(css);
    
    // Check for viewport units
    const hasViewportUnits = /[0-9]+\s*(vw|vh|vmin|vmax)/.test(css);
    
    // Determine overall quality
    let status = 'good';
    let message = 'The generated CSS includes mobile-responsive features.';
    
    if (mediaQueryCount > 3 && (flexboxCount > 2 || gridCount > 1) && hasTouchProperties && hasViewportUnits) {
      status = 'excellent';
      message = 'Excellent! The generated CSS is highly optimized for mobile devices.';
    } else if (mediaQueryCount === 0 && flexboxCount === 0 && gridCount === 0) {
      status = 'basic';
      message = 'Basic mobile compatibility. Consider using the "comprehensive" optimization level for better results.';
    }
    
    return {
      status,
      message,
      mediaQueries: mediaQueryCount,
      flexboxUsage: flexboxCount,
      gridUsage: gridCount,
      touchProperties: hasTouchProperties ? 'Yes' : 'No',
      viewportUnits: hasViewportUnits ? 'Yes' : 'No'
    };
  };
  
  // Apply the generated CSS to the preview iframe
  const applyCSS = () => {
    if (!previewIframeRef || !previewIframeRef.current || !generatedCSS) return;
    
    try {
      const iframe = previewIframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Check if the style element already exists
      let styleElement = iframeDoc.getElementById('autocss-mobile-styles');
      
      if (!styleElement) {
        // Create a new style element if it doesn't exist
        styleElement = iframeDoc.createElement('style');
        styleElement.id = 'autocss-mobile-styles';
        iframeDoc.head.appendChild(styleElement);
      }
      
      // Update the style content
      styleElement.textContent = generatedCSS;
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error applying CSS to preview:', err);
      setError('Failed to apply CSS to preview. This may be due to CORS restrictions.');
    }
  };
  
  // Download the generated CSS
  const downloadCSS = () => {
    if (!generatedCSS) return;
    
    // Create a blob with the CSS content
    const blob = new Blob([generatedCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    
    // Generate a filename based on the URL or project ID
    const filename = `mobile-${selectedDevice.name.toLowerCase().replace(/\s+/g, '-')}-${orientation}-${new Date().toISOString().slice(0, 10)}.css`;
    link.download = filename;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Render the component
  return React.createElement('div', { className: 'mobile-css-generator' },
    // Device selection
    React.createElement('div', { className: 'generator-section' },
      React.createElement('h3', null, 'Target Device'),
      React.createElement('div', { className: 'device-selector' },
        DEVICE_PRESETS.filter(device => 
          device.name.includes('Mobile') || 
          device.name.includes('iPhone') || 
          device.name.includes('Pixel') || 
          device.name.includes('Samsung')
        ).map(device => 
          React.createElement('button', {
            key: device.name,
            className: `device-button ${selectedDevice.name === device.name ? 'active' : ''}`,
            onClick: () => setSelectedDevice(device)
          },
            React.createElement('span', { className: 'device-icon' }, device.icon),
            React.createElement('span', { className: 'device-name' }, device.name)
          )
        )
      )
    ),
    
    // Orientation selection
    React.createElement('div', { className: 'generator-section' },
      React.createElement('h3', null, 'Orientation'),
      React.createElement('div', { className: 'orientation-selector' },
        React.createElement('button', {
          className: `orientation-button ${orientation === 'portrait' ? 'active' : ''}`,
          onClick: () => setOrientation('portrait')
        }, 'Portrait 📱'),
        React.createElement('button', {
          className: `orientation-button ${orientation === 'landscape' ? 'active' : ''}`,
          onClick: () => setOrientation('landscape')
        }, 'Landscape 📱↔️')
      )
    ),
    
    // Optimization level selection
    React.createElement('div', { className: 'generator-section' },
      React.createElement('h3', null, 'Optimization Level'),
      React.createElement('div', { className: 'optimization-selector' },
        React.createElement('button', {
          className: `optimization-button ${optimizationLevel === 'minimal' ? 'active' : ''}`,
          onClick: () => setOptimizationLevel('minimal')
        }, 'Minimal'),
        React.createElement('button', {
          className: `optimization-button ${optimizationLevel === 'standard' ? 'active' : ''}`,
          onClick: () => setOptimizationLevel('standard')
        }, 'Standard'),
        React.createElement('button', {
          className: `optimization-button ${optimizationLevel === 'comprehensive' ? 'active' : ''}`,
          onClick: () => setOptimizationLevel('comprehensive')
        }, 'Comprehensive')
      ),
      React.createElement('p', { className: 'optimization-description' },
        optimizationLevel === 'minimal' 
          ? 'Basic mobile compatibility with minimal changes to the original design.'
          : optimizationLevel === 'standard'
            ? 'Balanced approach with responsive layouts and touch-friendly elements.'
            : 'Complete mobile optimization with advanced features and performance enhancements.'
      )
    ),
    
    // Generate button
    React.createElement('div', { className: 'generator-section' },
      React.createElement('button', {
        className: 'generate-button',
        onClick: generateMobileCSS,
        disabled: isGenerating
      }, isGenerating ? 'Generating...' : 'Generate Mobile CSS')
    ),
    
    // Error message
    error && React.createElement('div', { className: 'error-message' }, error),
    
    // CSS Analysis
    cssAnalysis && React.createElement('div', { className: 'css-analysis' },
      React.createElement('h3', null, 'CSS Analysis'),
      React.createElement('div', { className: `analysis-status ${cssAnalysis.status}` }, cssAnalysis.message),
      React.createElement('div', { className: 'analysis-details' },
        React.createElement('div', { className: 'analysis-item' },
          React.createElement('span', { className: 'analysis-label' }, 'Media Queries:'),
          React.createElement('span', { className: 'analysis-value' }, cssAnalysis.mediaQueries)
        ),
        React.createElement('div', { className: 'analysis-item' },
          React.createElement('span', { className: 'analysis-label' }, 'Flexbox Usage:'),
          React.createElement('span', { className: 'analysis-value' }, cssAnalysis.flexboxUsage)
        ),
        React.createElement('div', { className: 'analysis-item' },
          React.createElement('span', { className: 'analysis-label' }, 'Grid Usage:'),
          React.createElement('span', { className: 'analysis-value' }, cssAnalysis.gridUsage)
        ),
        React.createElement('div', { className: 'analysis-item' },
          React.createElement('span', { className: 'analysis-label' }, 'Touch Properties:'),
          React.createElement('span', { className: 'analysis-value' }, cssAnalysis.touchProperties)
        ),
        React.createElement('div', { className: 'analysis-item' },
          React.createElement('span', { className: 'analysis-label' }, 'Viewport Units:'),
          React.createElement('span', { className: 'analysis-value' }, cssAnalysis.viewportUnits)
        )
      )
    ),
    
    // Generated CSS
    generatedCSS && React.createElement('div', { className: 'generator-section' },
      React.createElement('div', { className: 'css-header' },
        React.createElement('h3', null, 'Generated CSS'),
        React.createElement('div', { className: 'css-actions' },
          React.createElement('button', {
            className: 'toggle-css-button',
            onClick: () => setShowCSSCode(!showCSSCode)
          }, showCSSCode ? 'Hide Code' : 'Show Code'),
          React.createElement('button', {
            className: 'download-button',
            onClick: downloadCSS
          }, 'Download CSS')
        )
      ),
      showCSSCode && React.createElement('pre', { className: 'css-code' }, generatedCSS),
      React.createElement('button', {
        className: 'apply-button',
        onClick: applyCSS,
        disabled: !generatedCSS
      }, 'Apply to Preview')
    )
  );
};

// Add CSS styles for the MobileCSSGenerator component
const addMobileCSSGeneratorStyles = () => {
  const styleId = 'mobile-css-generator-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .mobile-css-generator {
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      color: #333;
      height: 100%;
      overflow-y: auto;
    }
    
    .generator-section {
      margin-bottom: 20px;
    }
    
    .generator-section h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
      color: #444;
    }
    
    .device-selector,
    .orientation-selector,
    .optimization-selector {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .device-button,
    .orientation-button,
    .optimization-button {
      padding: 8px 12px;
      background-color: #444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .device-button:hover,
    .orientation-button:hover,
    .optimization-button:hover {
      background-color: #555;
    }
    
    .device-button.active,
    .orientation-button.active,
    .optimization-button.active {
      background-color: #4361ee;
    }
    
    .device-icon {
      margin-right: 5px;
    }
    
    .optimization-description {
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    
    .generate-button {
      padding: 10px 20px;
      background-color: #4361ee;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
      width: 100%;
    }
    
    .generate-button:hover {
      background-color: #3651d4;
    }
    
    .generate-button:disabled {
      background-color: #999;
      cursor: not-allowed;
    }
    
    .error-message {
      padding: 10px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .css-analysis {
      padding: 15px;
      background-color: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .analysis-status {
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .analysis-status.excellent {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .analysis-status.good {
      background-color: #fff8e1;
      color: #f57f17;
    }
    
    .analysis-status.basic {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .analysis-status.perfect {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .analysis-details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    
    .analysis-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    
    .analysis-label {
      font-weight: bold;
      color: #555;
    }
    
    .css-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .css-actions {
      display: flex;
      gap: 10px;
    }
    
    .toggle-css-button,
    .download-button,
    .apply-button {
      padding: 8px 12px;
      background-color: #444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .toggle-css-button:hover,
    .download-button:hover,
    .apply-button:hover {
      background-color: #555;
    }
    
    .download-button {
      background-color: #4caf50;
    }
    
    .download-button:hover {
      background-color: #43a047;
    }
    
    .apply-button {
      background-color: #ff9800;
      width: 100%;
      margin-top: 10px;
    }
    
    .apply-button:hover {
      background-color: #f57c00;
    }
    
    .apply-button:disabled {
      background-color: #999;
      cursor: not-allowed;
    }
    
    .css-code {
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 10px;
      white-space: pre-wrap;
      color: #333;
    }
  `;
  
  document.head.appendChild(style);
};

// Add the styles when the script loads
addMobileCSSGeneratorStyles(); 