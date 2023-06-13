import { useEffect } from 'react';

function useListenForButtonPress(keyCode, callback, isEnabled) {
  useEffect(() => {
    if (!isEnabled) return;

    function handleKeyPress(event) {
      if (event.keyCode === keyCode) {
        callback();
      }
    }
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [keyCode, callback, isEnabled]);
}

export default useListenForButtonPress;
