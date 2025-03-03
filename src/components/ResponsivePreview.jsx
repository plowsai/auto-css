import React, { useState, useRef, useEffect } from 'react';
import './ResponsivePreview.css';

const DEVICE_PRESETS = [
  { name: 'Mobile S', width: 320, height: 568, icon: '📱' },
  { name: 'Mobile M', width: 375, height: 667, icon: '📱' },
  { name: 'Mobile L', width: 425, height: 812, icon: '📱' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📟' },
  { name: 'Laptop', width: 1024, height: 768, icon: '💻' },
  { name: 'Laptop L', width: 1440, height: 900, icon: '🖥️' },
  { name: 'Desktop', width: 1920, height: 1080, icon: '🖥️' },
];

const ResponsivePreview = ({ url, className }) => {
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_PRESETS[2]); // Default to Mobile L
  const [customSize, setCustomSize] = useState({ width: 425, height: 812 });
  const [isCustom, setIsCustom] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const iframeRef = useRef(null);

  // Handle device selection
  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
    setIsCustom(false);
    setOrientation('portrait');
  };

  // Handle custom size input
  const handleCustomSizeChange = (e) => {
    const { name, value } = e.target;
    setCustomSize(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
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
  const getScale = () => {
    if (!iframeRef.current) return 1;
    
    const container = iframeRef.current.parentElement;
    const { width, height } = getIframeDimensions();
    
    const containerWidth = container.clientWidth - 40; // Subtract padding
    const containerHeight = container.clientHeight - 40;
    
    const widthScale = containerWidth / width;
    const heightScale = containerHeight / height;
    
    // Use the smaller scale to ensure the iframe fits within the container
    return Math.min(widthScale, heightScale, 1);
  };

  // Update scale when dimensions change
  useEffect(() => {
    const updateScale = () => {
      if (!iframeRef.current) return;
      
      const scale = getScale();
      iframeRef.current.style.transform = `scale(${scale})`;
    };
    
    updateScale();
    
    // Add resize event listener
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [selectedDevice, customSize, orientation, isCustom]);

  const dimensions = getIframeDimensions();

  return (
    <div className={`responsive-preview ${className || ''}`}>
      <div className="responsive-controls">
        <div className="device-selector">
          {DEVICE_PRESETS.map(device => (
            <button
              key={device.name}
              className={`device-button ${!isCustom && selectedDevice.name === device.name ? 'active' : ''}`}
              onClick={() => handleDeviceChange(device)}
              title={`${device.name} (${device.width}x${device.height})`}
            >
              <span className="device-icon">{device.icon}</span>
              <span className="device-name">{device.name}</span>
            </button>
          ))}
          <button
            className={`device-button ${isCustom ? 'active' : ''}`}
            onClick={() => setIsCustom(true)}
            title="Custom size"
          >
            <span className="device-icon">🔧</span>
            <span className="device-name">Custom</span>
          </button>
        </div>
        
        {isCustom && (
          <div className="custom-size-inputs">
            <input
              type="number"
              name="width"
              value={customSize.width}
              onChange={handleCustomSizeChange}
              min="280"
              max="3840"
            />
            <span>×</span>
            <input
              type="number"
              name="height"
              value={customSize.height}
              onChange={handleCustomSizeChange}
              min="280"
              max="2160"
            />
          </div>
        )}
        
        <button
          className="orientation-button"
          onClick={toggleOrientation}
          title="Toggle orientation"
        >
          {orientation === 'portrait' ? '↕️' : '↔️'}
        </button>
        
        <div className="dimensions-display">
          {dimensions.width} × {dimensions.height}
        </div>
      </div>
      
      <div className="preview-container">
        <div 
          className="iframe-wrapper"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          <iframe
            ref={iframeRef}
            src={url}
            title="Responsive Preview"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsivePreview; 