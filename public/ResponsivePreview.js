// ResponsivePreview component for AutoCSS
// This component creates a responsive preview window that shows the website at different screen sizes

const DEVICE_PRESETS = [
  { name: 'Mobile S', width: 320, height: 568, icon: '📱' },
  { name: 'Mobile M', width: 375, height: 667, icon: '📱' },
  { name: 'Mobile L', width: 425, height: 812, icon: '📱' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📟' },
  { name: 'Laptop', width: 1024, height: 768, icon: '💻' },
  { name: 'Laptop L', width: 1440, height: 900, icon: '🖥️' },
  { name: 'Desktop', width: 1920, height: 1080, icon: '🖥️' },
];

// ResponsivePreview component
const ResponsivePreview = ({ url }) => {
  const [selectedDevice, setSelectedDevice] = React.useState(DEVICE_PRESETS[2]); // Default to Mobile L
  const [customSize, setCustomSize] = React.useState({ width: 425, height: 812 });
  const [isCustom, setIsCustom] = React.useState(false);
  const [orientation, setOrientation] = React.useState('portrait');
  const iframeRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  // Handle device selection
  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
    setIsCustom(false);
    setOrientation('portrait');
  };

  // Handle custom size input
  const handleCustomWidthChange = (e) => {
    setCustomSize(prev => ({
      ...prev,
      width: parseInt(e.target.value, 10) || 0
    }));
  };

  const handleCustomHeightChange = (e) => {
    setCustomSize(prev => ({
      ...prev,
      height: parseInt(e.target.value, 10) || 0
    }));
  };

  // Toggle orientation (portrait/landscape)
  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
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
    const newScale = Math.min(widthScale, heightScale, 1);
    setScale(newScale);
  };

  // Update scale when dimensions change
  React.useEffect(() => {
    updateScale();
    
    // Add resize event listener
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedDevice, customSize, orientation, isCustom]);

  const dimensions = getIframeDimensions();

  return React.createElement('div', { className: 'responsive-preview' },
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
      
      // Dimensions display
      React.createElement('div', { className: 'dimensions-display' },
        `${dimensions.width} × ${dimensions.height}`
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
          style: {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
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
    
    .orientation-button {
      background: none;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    
    .orientation-button:hover {
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
    
    .iframe-wrapper {
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      overflow: hidden;
      background-color: white;
      transition: width 0.3s ease, height 0.3s ease;
      position: relative;
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