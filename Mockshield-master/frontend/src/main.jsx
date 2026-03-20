import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './style.css';
// We are temporarily removing the GoogleOAuthProvider wrapper 
// to prevent crashes if the Client ID is missing or invalid.
// The app will work fine because we are using the "Bypass Login" strategy.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);