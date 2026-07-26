import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CueBar from './CueBar.jsx';
import '../index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <CueBar />
    </StrictMode>,
);