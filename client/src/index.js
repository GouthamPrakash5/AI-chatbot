import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CssBaseline } from '@mui/material';

// 1. Find the root element
const container = document.getElementById('root');

// 2. Create a root
const root = createRoot(container);

// 3. Render the app
root.render(
  <React.StrictMode>
    <CssBaseline />
    <App />
  </React.StrictMode>
);