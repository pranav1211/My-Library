import React, { useState } from 'react';
import BarcodeReader from 'react-barcode-reader';

const BarcodeScanner = () => {
  const [result, setResult] = useState('');

  const handleScan = (data) => {
    if (data) {
      setResult(data);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div>
      <h1>Barcode Scanner</h1>
      <BarcodeReader
        onError={handleError}
        onScan={handleScan}
      />
      <p>Scanned Result: {result}</p>
    </div>
  );
};

export default BarcodeScanner;
