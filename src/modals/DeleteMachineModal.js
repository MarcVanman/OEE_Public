import React from 'react';
import useMachineContext from '../hooks/use-machine-context';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';

function DeleteMachineModal() {
  const {showDeleteMachineModal, selectedMachine, handleDeleteMachineClose, deleteMachineById, handleModalClose } = useMachineContext();

  const handleJaClick = () => {
    deleteMachineById(selectedMachine.id);
    handleModalClose();
    }

  useListenForButtonPress(27, handleDeleteMachineClose, showDeleteMachineModal);

  if (!showDeleteMachineModal) {
    return null;
  }

  return (
    <div className="primaryModal subModal">
      <button className="primary_modal_exit_button" onClick={handleDeleteMachineClose}>
        X
      </button>
      <div className="deleteMachineModalContent">
        <p className="deleteMachineModalText">
          Er du sikker på at du vil slette {selectedMachine.name}?
        </p>
        <div className="deleteMachineButtonContainer">
          <button className="deleteMachineModalButton jaButton" onClick={handleJaClick}>
            Ja
          </button>
          <button className="deleteMachineModalButton nejButton" onClick={handleDeleteMachineClose}>
            Nej
          </button>
        </div>
      </div>
    </div>
  );
  
}

export default DeleteMachineModal;
