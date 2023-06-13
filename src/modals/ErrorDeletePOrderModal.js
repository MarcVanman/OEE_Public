import React from 'react';
import './SuccessModal.css';

const ErrorModal = ({ showModal, closeModal }) => {
    if (!showModal) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Fejl. Kunne ikke slette P-Order.</h3>
                <button className='success-modal-button' onClick={closeModal}>OK</button>
            </div>
        </div>
    );
};

export default ErrorModal;