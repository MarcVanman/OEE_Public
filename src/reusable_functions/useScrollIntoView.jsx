import { useEffect } from 'react';

export function useScrollIntoView(ref, show) {
  useEffect(() => {
    if (show && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [show, ref]);
}
