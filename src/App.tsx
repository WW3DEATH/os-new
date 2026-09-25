import React from 'react';
import { OSProvider } from './context/OSContext';
import { Desktop } from './components/desktop/Desktop';

export default function App() {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}
