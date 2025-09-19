import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Suppress DEP0060 warning for util._extend in Node environment only
if (typeof process !== 'undefined' && process.emitWarning) {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = (warning, ...args) => {
    if (typeof warning === 'string' && warning.includes('util._extend')) {
      return;
    }
    return originalEmitWarning(warning, ...args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
