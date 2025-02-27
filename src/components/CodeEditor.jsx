import React, { useState } from 'react';

const CodeEditor = ({ code, language, onChange }) => {
  const [value, setValue] = useState(code || '');
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <span className="language-badge">{language || 'javascript'}</span>
      </div>
      <textarea
        className="code-editor"
        value={value}
        onChange={handleChange}
        spellCheck="false"
        aria-label="Code editor"
      />
    </div>
  );
};

export default CodeEditor; 