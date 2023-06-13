import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ showModal, closeModal }) => {
  if (!showModal) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Successfuld registrering!</h3>
        <button className='success-modal-button' onClick={closeModal}>OK</button>
      </div>
    </div>
  );
};

export default SuccessModal;