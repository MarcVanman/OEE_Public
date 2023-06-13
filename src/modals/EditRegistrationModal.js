import React, { useRef } from 'react';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import PrimaryModalContext from '../contexts/PrimaryModalContext';
import EditPOrder from '../components/EditPOrder';
import DeletePOrder from '../components/DeletePOrder';
import EditDaily from '../components/EditDaily';

function EditRegistrationModal() {
    const dialogRef = useRef(null);

    const primaryModalContext = React.useContext(PrimaryModalContext);
    const {
        editModalOpen,
        setEditModalOpen,
        setEditPOrderModalOpen,
        setEditDailyModalOpen,
        editDailyModalOpen,
        editPOrderModalOpen,
        deletePOrderModalOpen,
        setDeletePOrderModalOpen,
    } = primaryModalContext;

    const openEditPOrderModal = () => {
        setEditPOrderModalOpen(true);
    };

    const openEditDailyModal = () => {
        setEditDailyModalOpen(true);
    };

    const openDeletePOrderModal = () => {
        setDeletePOrderModalOpen(true);
    };


    React.useEffect(() => {
        if (editModalOpen) {
            dialogRef.current.showModal();
        } else {
            dialogRef.current.close();
        }
    }, [editModalOpen]);

    const handleModalCloseEmptyInputs = () => {
        setEditModalOpen(false);
        setEditDailyModalOpen(false);
        setEditPOrderModalOpen(false);
        setDeletePOrderModalOpen(false);
    };

    const handleEscapePress = () => {
        setEditDailyModalOpen(false);
        setEditPOrderModalOpen(false);
        setEditModalOpen(false);
        setDeletePOrderModalOpen(false);
    };


    useListenForButtonPress(27, handleEscapePress, true);

    const handlePOrderClick = () => {
        openEditPOrderModal();
    };

    const handleDeletePOrderClick = () => {
        openDeletePOrderModal();
    };

    const handleRegisterTimeClick = () => {
        openEditDailyModal();
    };

    let content = (
        <div className='primaryModal subModal'>
            <h2 className='primary_modal_header'>Rediger eller Slet</h2>
            <div className='container-row'>
                <button className='primary_modal_exit_button' onClick={handleModalCloseEmptyInputs}>
                    X
                </button>
            </div>
            <div className='container-row'>
                <div className="edit_modal_button_container" onClick={() => handlePOrderClick()}>
                    <div className="edit_material_icons_container" >
                        <i className="material_icons" >article</i>
                    </div>
                    <button className="edit_modal_button">Rediger<br />P-Ordre</button>
                </div>
                <div className="edit_modal_button_container" onClick={() => handleDeletePOrderClick()}>
                    <div className="edit_material_icons_container" >
                        <i className="material_icons" >article</i>
                    </div>
                    <button className="edit_modal_button">Slet<br />P-Ordre</button>
                </div>
                <div className="edit_modal_button_container" onClick={() => handleRegisterTimeClick()}>
                    <div className="edit_material_icons_container" >
                        <i className="material_icons" >content_paste</i>
                    </div>
                    <button className="edit_modal_button">Slet<br />Registrering<br />og Stop</button>

                </div>
            </div>
        </div>
    );

    if (editPOrderModalOpen && !editDailyModalOpen && !deletePOrderModalOpen) {
        content = (
            <div className='primaryModal subModal'>
                <EditPOrder />
            </div>
        );
    } else if (deletePOrderModalOpen && !editDailyModalOpen && !editPOrderModalOpen) {
        content = (
            <div className='primaryModal subModal'>
                <DeletePOrder />
            </div>
        );
    }
    else if (editDailyModalOpen && !editPOrderModalOpen && !deletePOrderModalOpen) {
        content = (
            <div className='primaryModal subModal'>
                <EditDaily />
            </div>
        );
    }


    return (
        <dialog ref={dialogRef}>
            {content}
        </dialog>
    );
};

export default EditRegistrationModal;
