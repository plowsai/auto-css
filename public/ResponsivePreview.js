// ResponsivePreview component for AutoCSS
// This component creates a responsive preview window that shows the website at different screen sizes

// Note: We're now using the DEVICE_PRESETS from DevicePresets.js
// const DEVICE_PRESETS = [
//   { name: 'Mobile S', width: 320, height: 568, icon: '📱' },
//   { name: 'Mobile M', width: 375, height: 667, icon: '📱' },
//   { name: 'Mobile L', width: 425, height: 812, icon: '📱' },
//   { name: 'Tablet', width: 768, height: 1024, icon: '📟' },
//   { name: 'Laptop', width: 1024, height: 768, icon: '💻' },
//   { name: 'Laptop L', width: 1440, height: 900, icon: '🖥️' },
//   { name: 'Desktop', width: 1920, height: 1080, icon: '🖥️' },
// ];

// ResponsivePreview component
const ResponsivePreview = ({ url, projectId }) => {
  const [selectedDevice, setSelectedDevice] = React.useState(DEVICE_PRESETS[2]); // Default to Mobile L
  const [customSize, setCustomSize] = React.useState({ width: 425, height: 812 });
  const [isCustom, setIsCustom] = React.useState(false);
  const [orientation, setOrientation] = React.useState('portrait');
  const iframeRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  const [showMobileCSSGenerator, setShowMobileCSSGenerator] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('preview'); // 'preview' or 'generate'
  const [isAlreadyOptimized, setIsAlreadyOptimized] = React.useState(false);
  const [isCheckingOptimization, setIsCheckingOptimization] = React.useState(false);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [iframeError, setIframeError] = React.useState(false);
  const [notification, setNotification] = React.useState(null);

  // Handle device selection
  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
    setIsCustom(false);
    setOrientation('portrait');
    // Reset optimization check when device changes
    setIsAlreadyOptimized(false);
    setIframeError(false);
    
    // Check if the site is already optimized for mobile
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        checkMobileOptimization();
      }, 1000);
    }
  };

  // Handle custom size input
  const handleCustomWidthChange = (e) => {
    const width = parseInt(e.target.value) || customSize.width;
    setCustomSize(prev => ({ ...prev, width }));
    setIsCustom(true);
  };

  const handleCustomHeightChange = (e) => {
    const height = parseInt(e.target.value) || customSize.height;
    setCustomSize(prev => ({ ...prev, height }));
    setIsCustom(true);
  };

  // Toggle orientation (portrait/landscape)
  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
    // Reset optimization check when orientation changes
    setIsAlreadyOptimized(false);
    setIframeError(false);
    
    // Check if the site is already optimized for mobile in the new orientation
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        checkMobileOptimization();
      }, 1000);
    }
  };

  // Calculate iframe dimensions based on selected device and orientation
  const getIframeDimensions = () => {
    const device = isCustom ? customSize : selectedDevice;
    
    if (orientation === 'landscape') {
      return {
        width: device.height,
        height: device.width
      };
    }
    
    return {
      width: device.width,
      height: device.height
    };
  };

  // Calculate scale to fit the preview container
  const updateScale = () => {
    if (!iframeRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const { width, height } = getIframeDimensions();
    
    const containerWidth = container.clientWidth - 40; // Subtract padding
    const containerHeight = container.clientHeight - 40;
    
    const widthScale = containerWidth / width;
    const heightScale = containerHeight / height;
    
    // Use the smaller scale to ensure the iframe fits within the container
    // But ensure minimum scale is 0.5 to keep content visible
    const newScale = Math.max(Math.min(widthScale, heightScale, 1), 0.5);
    setScale(newScale);
  };

  // Check if the website is already mobile optimized
  const checkMobileOptimization = () => {
    if (!iframeRef.current || !iframeLoaded) return;
    
    setIsCheckingOptimization(true);
    
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Check for viewport meta tag
      const viewportMeta = iframeDoc.querySelector('meta[name="viewport"]');
      const hasViewportMeta = viewportMeta && viewportMeta.getAttribute('content').includes('width=device-width');
      
      // Check for media queries in stylesheets
      let hasMediaQueries = false;
      const styleSheets = Array.from(iframeDoc.styleSheets || []);
      
      try {
        // This may throw CORS errors for external stylesheets
        hasMediaQueries = styleSheets.some(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            return rules.some(rule => rule.type === CSSRule.MEDIA_RULE);
          } catch (e) {
            // CORS error, can't access rules
            return false;
          }
        });
      } catch (e) {
        console.log('Could not check media queries due to CORS:', e);
      }
      
      // Check for responsive frameworks
      const hasBootstrap = iframeDoc.querySelector('[class*="container"], [class*="row"], [class*="col-"]');
      const hasFoundation = iframeDoc.querySelector('.grid-x, .cell, .grid-container');
      const hasTailwind = iframeDoc.querySelector('[class*="md:"], [class*="lg:"], [class*="sm:"]');
      
      // Check for mobile-friendly design patterns
      const hasFlexbox = iframeDoc.querySelector('[style*="display: flex"], [style*="display:flex"]');
      const hasGrid = iframeDoc.querySelector('[style*="display: grid"], [style*="display:grid"]');
      const hasRem = iframeDoc.querySelector('[style*="rem"]');
      
      // Determine if the site is already optimized
      const isOptimized = hasViewportMeta && 
        (hasMediaQueries || hasBootstrap || hasFoundation || hasTailwind || 
         (hasFlexbox && hasGrid && hasRem));
      
      setIsAlreadyOptimized(isOptimized);
      
      if (isOptimized) {
        showTemporaryNotification('This website appears to be already optimized for mobile devices. The CSS is perfect!');
      }
    } catch (err) {
      console.error('Error checking mobile optimization:', err);
    } finally {
      setIsCheckingOptimization(false);
    }
  };

  // Show a temporary notification
  const showTemporaryNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    updateScale();
    
    // Check optimization after a short delay to ensure styles are loaded
    setTimeout(checkMobileOptimization, 1000);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(true); // Set loaded to true to remove loading indicator
    showTemporaryNotification('Failed to load the website. Please check the URL and try again.');
  };

  // Reload iframe
  const reloadIframe = () => {
    if (!iframeRef.current) return;
    
    setIframeLoaded(false);
    setIframeError(false);
    iframeRef.current.src = url;
  };

  // Update scale when dimensions change
  React.useEffect(() => {
    updateScale();
    
    // Add resize event listener
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedDevice, customSize, orientation, isCustom, activeTab]);

  // Update scale when container is resized
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const dimensions = getIframeDimensions();

  // Determine device type class for styling
  const getDeviceTypeClass = () => {
    const { width } = dimensions;
    
    if (width < 600) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  return React.createElement('div', { className: 'responsive-preview' },
    // Tabs for switching between preview and generate modes
    React.createElement('div', { className: 'preview-tabs' },
      React.createElement('button', {
        className: `preview-tab ${activeTab === 'preview' ? 'active' : ''}`,
        onClick: () => setActiveTab('preview')
      }, 'Preview'),
      React.createElement('button', {
        className: `preview-tab ${activeTab === 'generate' ? 'active' : ''}`,
        onClick: () => setActiveTab('generate')
      }, 'Generate Mobile CSS')
    ),
    
    // Notification banner
    showNotification && React.createElement('div', { 
      className: `notification-banner ${isAlreadyOptimized ? 'success' : 'info'}`
    },
      React.createElement('span', null, notificationMessage),
      React.createElement('button', { 
        className: 'close-notification',
        onClick: () => setShowNotification(false)
      }, '×')
    ),
    
    // Content based on active tab
    activeTab === 'preview' ? (
      React.createElement(React.Fragment, null,
        // Controls section
        React.createElement('div', { className: 'responsive-controls' },
          // Device selector
          React.createElement('div', { className: 'device-selector' },
            DEVICE_PRESETS.map(device => 
              React.createElement('button', {
                key: device.name,
                className: `device-button ${!isCustom && selectedDevice.name === device.name ? 'active' : ''}`,
                onClick: () => handleDeviceChange(device),
                title: `${device.name} (${device.width}x${device.height})`
              },
                React.createElement('span', { className: 'device-icon' }, device.icon),
                React.createElement('span', { className: 'device-name' }, device.name)
              )
            ),
            React.createElement('button', {
              className: `device-button ${isCustom ? 'active' : ''}`,
              onClick: () => setIsCustom(true),
              title: 'Custom size'
            },
              React.createElement('span', { className: 'device-icon' }, '🔧'),
              React.createElement('span', { className: 'device-name' }, 'Custom')
            )
          ),
          
          // Custom size inputs
          isCustom && React.createElement('div', { className: 'custom-size-inputs' },
            React.createElement('input', {
              type: 'number',
              value: customSize.width,
              onChange: handleCustomWidthChange,
              min: '280',
              max: '3840'
            }),
            React.createElement('span', null, '×'),
            React.createElement('input', {
              type: 'number',
              value: customSize.height,
              onChange: handleCustomHeightChange,
              min: '280',
              max: '2160'
            })
          ),
          
          // Orientation toggle
          React.createElement('button', {
            className: 'orientation-button',
            onClick: toggleOrientation,
            title: 'Toggle orientation'
          }, orientation === 'portrait' ? '↕️' : '↔️'),
          
          // Reload button
          React.createElement('button', {
            className: 'reload-button',
            onClick: reloadIframe,
            title: 'Reload preview'
          }, '🔄'),
          
          // Dimensions display
          React.createElement('div', { className: 'dimensions-display' },
            `${dimensions.width} × ${dimensions.height}`
          ),
          
          // Optimization status
          isAlreadyOptimized && React.createElement('div', { className: 'optimization-badge' },
            '✓ Mobile Optimized'
          )
        ),
        
        // Preview container
        React.createElement('div', { 
          className: 'preview-container',
          ref: containerRef
        },
          React.createElement('div', {
            className: 'iframe-wrapper',
            style: {
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }
          },
            React.createElement('iframe', {
              ref: iframeRef,
              src: url,
              title: 'Responsive Preview',
              onLoad: handleIframeLoad,
              onError: handleIframeError,
              style: {
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`
              }
            }),
            !iframeLoaded && React.createElement('div', { className: 'iframe-loading' },
              'Loading preview...'
            ),
            iframeError && React.createElement('div', { className: 'iframe-error' },
              React.createElement('div', { className: 'error-icon' }, '⚠️'),
              React.createElement('div', { className: 'error-message' }, 'Failed to load the website'),
              React.createElement('button', { 
                className: 'retry-button',
                onClick: reloadIframe
              }, 'Retry')
            )
          )
        )
      )
    ) : (
      // Mobile CSS Generator tab content
      React.createElement('div', { className: 'generator-container' },
        React.createElement(MobileCSSGenerator, { 
          projectId: projectId, 
          url: url,
          previewIframeRef: iframeRef,
          isAlreadyOptimized: isAlreadyOptimized
        })
      )
    )
  );
};

// Add CSS styles for the ResponsivePreview component
const addResponsivePreviewStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .responsive-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
    
    .preview-tabs {
      display: flex;
      background-color: #1e1e1e;
      border-bottom: 1px solid #444;
    }
    
    .preview-tab {
      padding: 12px 20px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: #aaa;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .preview-tab:hover {
      color: #ddd;
      background-color: #2a2a2a;
    }
    
    .preview-tab.active {
      color: #4361ee;
      border-bottom-color: #4361ee;
      background-color: #2a2a2a;
    }
    
    .notification-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: rgba(67, 97, 238, 0.2);
      border-left: 4px solid #4361ee;
      color: #e0e0e0;
      margin-bottom: 10px;
    }
    
    .notification-banner.success {
      background-color: rgba(46, 164, 79, 0.2);
      border-left-color: #2ea44f;
    }
    
    .notification-banner.error {
      background-color: rgba(220, 53, 69, 0.2);
      border-left-color: #dc3545;
    }
    
    .close-notification {
      background: none;
      border: none;
      color: #e0e0e0;
      font-size: 18px;
      cursor: pointer;
      padding: 0 5px;
    }
    
    .responsive-controls {
      display: flex;
      align-items: center;
      padding: 10px;
      background-color: #2a2a2a;
      border-bottom: 1px solid #444;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .device-selector {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    
    .device-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 5px 8px;
      background: none;
      border: 1px solid #444;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      color: #ddd;
    }
    
    .device-button:hover {
      background-color: #3a3a3a;
    }
    
    .device-button.active {
      background-color: #4361ee;
      color: white;
      border-color: #4361ee;
    }
    
    .device-icon {
      font-size: 16px;
      margin-bottom: 2px;
    }
    
    .device-name {
      font-size: 11px;
      white-space: nowrap;
    }
    
    .custom-size-inputs {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #ddd;
    }
    
    .custom-size-inputs input {
      width: 60px;
      padding: 4px;
      border: 1px solid #444;
      border-radius: 4px;
      text-align: center;
      background-color: #333;
      color: #ddd;
    }
    
    .orientation-button, .reload-button {
      background: none;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    
    .orientation-button:hover, .reload-button:hover {
      background-color: #3a3a3a;
    }
    
    .dimensions-display {
      margin-left: auto;
      font-size: 12px;
      color: #ddd;
      background-color: #333;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .optimization-badge {
      font-size: 12px;
      color: #fff;
      background-color: #2ea44f;
      padding: 4px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .preview-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
      background-color: #1a1a1a;
      padding: 20px;
      position: relative;
    }
    
    .generator-container {
      flex: 1;
      overflow: auto;
      background-color: #1a1a1a;
      padding: 20px;
    }
    
    .iframe-wrapper {
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      overflow: hidden;
      background-color: white;
      transition: width 0.3s ease, height 0.3s ease;
      position: relative;
    }
    
    .iframe-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 14px;
      z-index: 5;
    }
    
    .iframe-error {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      font-size: 14px;
      z-index: 5;
      gap: 15px;
    }
    
    .error-icon {
      font-size: 32px;
    }
    
    .error-message {
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .retry-button {
      background-color: #4361ee;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .retry-button:hover {
      background-color: #3a56d4;
    }
    
    .iframe-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 24px;
      background-color: #333;
      border-bottom: 1px solid #444;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      z-index: 10;
    }
    
    .iframe-wrapper::after {
      content: '⬤ ⬤ ⬤';
      position: absolute;
      top: 4px;
      left: 8px;
      font-size: 10px;
      color: #666;
      letter-spacing: 2px;
      z-index: 11;
    }
    
    .iframe-wrapper iframe {
      border: none;
      background-color: white;
      padding-top: 24px; /* Space for the browser chrome */
      box-sizing: border-box;
      width: 100% !important;
      height: 100% !important;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .responsive-controls {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .dimensions-display {
        margin-left: 0;
        margin-top: 5px;
      }
    }
  `;
  document.head.appendChild(style);
};

// Add the styles when the script loads
addResponsivePreviewStyles(); 