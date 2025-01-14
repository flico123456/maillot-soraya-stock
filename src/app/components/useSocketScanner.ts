import { useEffect, useState } from 'react';
import { Capture } from 'socketmobile-capturejs';

const useSocketScanner = (licenseKey: string) => {
  const [scannerData, setScannerData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCapture = async () => {
      try {
        const capture = new Capture();
        await capture.initialize(licenseKey);

        // Listen for decoded data
        capture.on('decodedData', (event) => {
          const { decodedData } = event.detail;
          setScannerData(decodedData.data);
        });

        // Listen for errors
        capture.on('error', (event) => {
          setError(event.detail.message);
        });
      } catch (e) {
        setError(e.message || 'Error initializing Socket Mobile Capture');
      }
    };

    initCapture();

    // Cleanup on unmount
    return () => {
      Capture.destroy();
    };
  }, [licenseKey]);

  return { scannerData, error };
};

export default useSocketScanner;
