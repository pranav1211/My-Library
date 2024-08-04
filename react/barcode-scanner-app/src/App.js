import React from 'react';
import BarcodeScanner from './scanner';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Barcode Scanner</h1>
      </header>
      <main>
        <BarcodeScanner />
      </main>
    </div>
  );
}

export default App;
