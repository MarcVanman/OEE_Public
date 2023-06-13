import { useContext } from 'react';
import MachineContext from '../contexts/MachineContext';

function useMachineContext() {
  return useContext(MachineContext);
}

export default useMachineContext;