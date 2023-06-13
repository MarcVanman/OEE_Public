import { useState } from 'react';
import MachineInterface from './MachineInterface';
import useMachineContext from '../hooks/use-machine-context';

function MachineShow({ machine, onMoveUp, onMoveDown }) {

  const { handleClickModal } = useMachineContext();
  const [showMachine, setShowMachine] = useState(false);

  const handleClick = () => {
    setShowMachine(!showMachine);
    handleClickModal(machine);
  };

  const handleCloseClick = () => {
    setShowMachine(false);
  };

  let showMachineContent = <div></div>;
  if (showMachine) {
    showMachineContent = <MachineInterface onClose={handleCloseClick} />;
  }

  return (
    <div className="machine-show">
      <div className="machine-interface-container">{showMachineContent}</div>
      <div className="image-container" onClick={handleClick}>
        <img className="machine-image" src={machine.imageUrl} alt="machines" />
        <div className="overlay">
          <span className="overlay-name">{machine.name}</span>
        </div>
      </div>
      <div className="machine-name">{machine.name}</div>
      <div className="machine-name-below">{machine.name}
        <div className="arrow-container">
          <button className="move-arrow" onClick={(e) => { e.stopPropagation(); onMoveUp(machine.id); }}>▲</button>
          <button className="move-arrow" onClick={(e) => { e.stopPropagation(); onMoveDown(machine.id); }}>▼</button>
        </div>
      </div>
    </div>
  );
}


export default MachineShow;