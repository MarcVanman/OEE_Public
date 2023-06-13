import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import React, { useContext, useEffect } from 'react';
import MachineContext from '../contexts/MachineContext';
import PrimaryModalContext from '../contexts/PrimaryModalContext';
import './modals.css';
import RegisterTimeModal from './RegisterTimeModal';
import OpretPOrderModal from './OpretPOrderModal';
import DeleteMachineModal from './DeleteMachineModal';
import MachineEdit from '../components/MachineEdit';
import { toggleBodyOverflow } from '../utilityFunctions/helper';
import { useNavigate } from 'react-router-dom';
import EditRegistrationModal from './EditRegistrationModal';


export default function MachinePrimaryModal() {
  const machineContext = useContext(MachineContext);
  const {
    showDeleteMachineModal,
    setShowDeleteMachineModal,
    showEdit,
    setShowEdit,
    showPrimaryModal,
    handleModalClose,
    selectedMachine,
    handleRegisterTimeClick,
    handlePOrderClick,
  } = machineContext;

  const primaryModalContext = useContext(PrimaryModalContext);
  const { editModalOpen, setEditModalOpen } = primaryModalContext;

  const openEditModal = () => {
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
  };

  const navigate = useNavigate();

  const handleVisStatistikClick = (machine) => {
    navigate('/dashboard', { state: { machine } });
  };


  useEffect(() => {
    // Call the function to toggle the body overflow whenever the modal opens or closes
    toggleBodyOverflow(showPrimaryModal);
    return () => {
      // Reset the body overflow when the component is unmounted
      toggleBodyOverflow(false);
    };
  }, [showPrimaryModal]);

  // Close modal when escape key is pressed (keyCode 27)
  const escapePress = () => {
    setShowEdit(false);
    handleModalClose();
  };

  useListenForButtonPress(27, escapePress, true);

  const handleEditRegistrationClick = () => {
    openEditModal();
  };



  const handleEditMachineClick = () => {
    setShowEdit(!showEdit);
  };

  const handleDeleteClick = () => {
    setShowDeleteMachineModal(!showDeleteMachineModal);
  }

  if (!showPrimaryModal) {
    return null;
  }

  let header = selectedMachine.name
  let content = null;
  if (showEdit) {
    header = `Skift navn eller billede for ${selectedMachine.name}`;
    content = <MachineEdit showEdit={showEdit} setShowEdit={setShowEdit} />;
  }

  return (
    <div className='modal_overlay'>
      <div className='primaryModal'>
        <h2 className='primary_modal_header'>{header}</h2>
        <i className='primary_modal_edit_button' onClick={handleEditMachineClick}>edit</i>
        <i className='primary_modal_delete_button' onClick={handleDeleteClick}>delete</i>
        <button className='primary_modal_exit_button' onClick={handleModalClose}>X</button>
        {!showEdit && (
          <div className='primary_modal_button_outer_container'>
            <div className="primary_modal_button_container" onClick={() => handlePOrderClick(selectedMachine)}>
              <div className="material_icons_container" >
                <i className="material_icons" >article</i>
              </div>
              <button className="primary_modal_button">Opret P-Ordre</button>
            </div>
            <div className="primary_modal_button_container" onClick={() => handleRegisterTimeClick(selectedMachine)}>
              <div className="material_icons_container" >
                <i className="material_icons" >content_paste_search</i>
              </div>
              <button className="primary_modal_button">Daglig registrering</button>
            </div>

            <div className="primary_modal_button_container" onClick={() => handleEditRegistrationClick(selectedMachine)}>
              <div className="material_icons_container">
                <i className="material_icons">edit_note</i>
              </div>
              <button className="primary_modal_button">Rediger registrering</button>
            </div>
            <div className="primary_modal_button_container" onClick={() => handleVisStatistikClick(selectedMachine)}>
              <div className="material_icons_container">
                <i className="material_icons">bar_chart</i>
              </div>
              <button className="primary_modal_button">Vis statistik</button>
            </div>
          </div>
        )}
        <div>
          {content}
        </div>
        <div>
          <OpretPOrderModal />
        </div>
        <div>
          <RegisterTimeModal />
        </div>
        <div>
          <DeleteMachineModal />
        </div>
        <div>
          <EditRegistrationModal />
        </div>
      </div>
    </div>
  );
}

