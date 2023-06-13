import { useContext } from 'react';
import PrimaryModalContext from '../contexts/PrimaryModalContext';

function usePrimaryModalContext() {
    return useContext(PrimaryModalContext);
}

export default usePrimaryModalContext;