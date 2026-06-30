import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('[attendance] VITE_API_BASE_URL is not set. Fill in .env before starting.');
}
if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn('[attendance] VITE_GOOGLE_CLIENT_ID is not set. Fill in .env before starting.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
