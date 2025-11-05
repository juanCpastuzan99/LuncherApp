/**
 * Punto de entrada del renderer (React)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Launcher } from './components/Launcher';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Launcher />
  </React.StrictMode>
);

