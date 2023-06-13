import React, { useState, useEffect } from 'react';
import SuccessModal from '../modals/SuccessModal';
import ErrorDeletePOrderModal from '../modals/ErrorDeletePOrderModal';
import axios from 'axios';
import useMachineContext from '../hooks/use-machine-context';
import usePrimaryModalContext from '../hooks/use-primary-modal-context';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import { Card, Text } from "@tremor/react";
import { Button } from "@tremor/react";
import { SelectBox, SelectBoxItem } from "@tremor/react";

const today = new Date();  // get today's date

function filterByCreationDate(returnedPOrders, createdDaysAgo) {
    return returnedPOrders.filter(order => {
        const creationDate = new Date(order.CreationDate);
        const differenceInTime = today - creationDate;
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        return differenceInDays <= createdDaysAgo;
    });
};

function DeletePOrder() {
    const { setDeletePOrderModalOpen } = usePrimaryModalContext();
    const { selectedMachine, getAllItems } = useMachineContext();
    const [hasInteractedPOrder, setHasInteractedPOrder] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const responseData = await getAllItems({
                all: true,
                table: 'OEE-P-Orders'
            });
            const filteredPOrders = filterByCreationDate(responseData, 60);
            const filteredPOrdersOnMachine = filteredPOrders.filter(order => order.Machine === selectedMachine.id);
            filteredPOrdersOnMachine.sort((a, b) => a.CreationDate < b.CreationDate ? 1 : (a.CreationDate > b.CreationDate ? -1 : 0));
            setOrders(filteredPOrdersOnMachine);
        };
        fetchData();
    }, [getAllItems, setOrders]);

    const handleModalCloseEmptyInputs = () => {
        setDeletePOrderModalOpen(false);
        setHasInteractedPOrder(false);
        setShowSuccessModal(false);
    };
    useListenForButtonPress(27, handleModalCloseEmptyInputs, true);

    const deletePOrderById = async (id) => {
        try {
            const response = await axios.delete(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/OEE-P-Orders/${id}`);
            if (response.status === 200) {
                console.log('P-Order deleted successfully!')
                const updatedOrders = orders.filter((order) => order.P_Order !== id);
                setOrders(updatedOrders);
                setShowSuccessModal(true);
            }
            else {
                console.error('Failed to delete P-Order:', response);
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Failed to delete P-Order:', error);
            setShowErrorModal(true);

        }
    };

    const handleCancelClick = (e) => {
        e.preventDefault();
        handleModalCloseEmptyInputs();
    };

    const handleSuccessModalClose = () => {
        handleModalCloseEmptyInputs();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('selectedOrder', selectedOrder)
        const response = await deletePOrderById(selectedOrder);
    };

    const handlePOrderChange = (pOrder) => {
        setSelectedOrder(pOrder);
        setHasInteractedPOrder(true);
    };

    useEffect(() => {
        if (selectedOrder) {
        }
    }, [selectedOrder]);

    return (
        <div className='primaryModal subModal'>
            <div className='container-row'>
                <button className='primary_modal_exit_button' onClick={handleModalCloseEmptyInputs}>
                    X
                </button>
                <div className='container-column'>
                    <h2 className='primary_modal_header'>Slet P-Ordre</h2>
                    <form onSubmit={handleSubmit}>
                        <Card className='delete-porder-card'>
                            <div className='delete-p-order'>
                                <div>
                                    <div className='p-order-form-inner-container'>
                                        <Text className='input-field-header'>P-Ordre nummer</Text>
                                        <div className='checkmark-container'>
                                            <div className="checkmark-wrapper">
                                                {hasInteractedPOrder && (
                                                    <i className="fa fa-check text-success checkmark"></i>
                                                )}
                                            </div>
                                            <div className="input-container">
                                                <SelectBox
                                                    className="text-input-field-p-order input-limited-width"
                                                    required
                                                    value={selectedOrder}
                                                    onValueChange={handlePOrderChange}
                                                >
                                                    {orders.length ? (
                                                        orders.map((item) => (
                                                            <SelectBoxItem key={item.P_Order} value={item.P_Order} text={item.P_Order.toString()} />
                                                        ))
                                                    ) : (
                                                        <SelectBoxItem disabled text={"Ingen P-Ordre oprettet på denne maskine"} />
                                                    )}
                                                </SelectBox>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.2vh' }}>
                            <div>
                                <Button size="lg" variant="primary" disabled={!(selectedOrder)}>
                                    Slet
                                </Button>
                            </div>
                            <div style={{ marginLeft: '1.5vw' }}>
                                <Button size="xl" variant="secondary" onClick={handleCancelClick}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <SuccessModal showModal={showSuccessModal} closeModal={handleSuccessModalClose} />
            <ErrorDeletePOrderModal showModal={showErrorModal} closeModal={handleModalCloseEmptyInputs} />
        </div>
    );
};

export default DeletePOrder;