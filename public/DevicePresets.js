// DevicePresets.js
// This file contains presets for various mobile devices

const DEVICE_PRESETS = [
  // Mobile Phones - Small
  {
    name: 'Mobile S',
    width: 320,
    height: 568,
    icon: '📱',
    description: 'Small mobile devices (iPhone SE, older Android phones)',
    pixelRatio: 2
  },
  
  // Mobile Phones - Medium
  {
    name: 'Mobile M',
    width: 375,
    height: 667,
    icon: '📱',
    description: 'Medium-sized mobile devices (iPhone 6/7/8)',
    pixelRatio: 2
  },
  
  // Mobile Phones - Large
  {
    name: 'Mobile L',
    width: 425,
    height: 812,
    icon: '📱',
    description: 'Large mobile devices (iPhone X/11/12 size)',
    pixelRatio: 3
  },
  
  // iPhone Models
  {
    name: 'iPhone X/11/12',
    width: 375,
    height: 812,
    icon: '📱',
    description: 'iPhone X, 11, 12 (Super Retina)',
    pixelRatio: 3
  },
  
  {
    name: 'iPhone 13/14 Pro',
    width: 390,
    height: 844,
    icon: '📱',
    description: 'iPhone 13 Pro, 14 Pro (Super Retina XDR)',
    pixelRatio: 3
  },
  
  // Google Pixel Models
  {
    name: 'Pixel 6/7',
    width: 393,
    height: 851,
    icon: '📱',
    description: 'Google Pixel 6, Pixel 7',
    pixelRatio: 2.75
  },
  
  // Samsung Models
  {
    name: 'Samsung S21/S22',
    width: 360,
    height: 800,
    icon: '📱',
    description: 'Samsung Galaxy S21, S22',
    pixelRatio: 3
  },
  
  // Tablets
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    icon: '📟',
    description: 'Standard iPad (9th/10th gen)',
    pixelRatio: 2
  },
  
  {
    name: 'iPad Pro',
    width: 834,
    height: 1194,
    icon: '📟',
    description: 'iPad Pro 11-inch',
    pixelRatio: 2
  },
  
  // Laptops and Desktops (for reference)
  {
    name: 'Laptop',
    width: 1366,
    height: 768,
    icon: '💻',
    description: 'Standard laptop resolution',
    pixelRatio: 1
  },
  
  {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    icon: '🖥️',
    description: 'Full HD desktop resolution',
    pixelRatio: 1
  }
];

// Export the device presets if in a module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEVICE_PRESETS };
}

// Helper function to get device by name
const getDeviceByName = (name) => {
  return DEVICE_PRESETS.find(device => device.name === name) || DEVICE_PRESETS[2]; // Default to Mobile L
};

// Helper function to get appropriate viewport meta tag for a device
const getViewportMetaForDevice = (device) => {
  return `width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0`;
};

// Helper function to generate CSS media queries for a device
const generateMediaQueryForDevice = (device, orientation = 'portrait') => {
  const width = orientation === 'portrait' ? device.width : device.height;
  const height = orientation === 'portrait' ? device.height : device.width;
  
  return `@media (max-width: ${width}px) and (max-height: ${height}px) {\n  /* Device-specific styles for ${device.name} in ${orientation} mode */\n}`;
};

// Export the device presets and helper functions
// Note: In a module environment, you would use export statements
// Since we're using plain JS in browser, these are globally available 