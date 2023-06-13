import React, { useState, useEffect } from 'react';
import SuccessModal from '../modals/SuccessModal';
import axios from 'axios';
import useMachineContext from '../hooks/use-machine-context';
import usePrimaryModalContext from '../hooks/use-primary-modal-context';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import { TextInput, Dropdown, DropdownItem } from "@tremor/react";
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

function EditPOrder() {
    const { setEditPOrderModalOpen } = usePrimaryModalContext();
    const { selectedMachine, getAllItems } = useMachineContext();
    const [validatedPerHour, setValidatedPerHour] = useState('');
    const [varenummer, setVarenummer] = useState('');
    const [isValidatedPerHourValid, setIsValidatedPerHourValid] = useState(null);
    const [isVarenummerValid, setIsVarenummerValid] = useState(null);
    const [hasInteractedPOrder, setHasInteractedPOrder] = useState(false);
    const [hasInteractedValidatedPerHour, setHasInteractedValidatedPerHour] = useState(false);
    const [hasInteractedVarenummer, setHasInteractedVarenummer] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    const editPOrderById = async (id, Machine, Validated_per_hour, Varenummer) => {
        try {
            let response = null;
            response = await axios.put(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/${id}`, {
                Machine: Machine,
                Validated_per_hour: Validated_per_hour,
                Varenummer: Varenummer,
                table_name: "OEE-P-Orders"
            });
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to edit machine:', error);
        }
    };

    const handleModalCloseEmptyInputs = () => {
        setEditPOrderModalOpen(false);
        setValidatedPerHour('');
        setVarenummer('');
        setIsValidatedPerHourValid(null);
        setIsVarenummerValid(null);
        setHasInteractedPOrder(false);
        setHasInteractedValidatedPerHour(false);
        setHasInteractedVarenummer(false);
        setShowSuccessModal(false);
    };
    useListenForButtonPress(27, handleModalCloseEmptyInputs, true);

    const handleCancelClick = (e) => {
        e.preventDefault();
        handleModalCloseEmptyInputs();
    };

    const machineId = selectedMachine.id;
    const machineName = selectedMachine.name;

    const handleSuccessModalClose = () => {
        handleModalCloseEmptyInputs();
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isValidatedPerHourValid && isVarenummerValid) {
            editPOrderById(selectedOrder, machineId, validatedPerHour, varenummer);
        } else {
            console.log("One or all inputs are invalid");
        }
    };

    const handlePOrderChange = (pOrder) => {
        setSelectedOrder(pOrder);
        const selected = orders.find(order => order.P_Order === pOrder);
        if (selected) {
            setVarenummer(selected.Varenummer);
            setValidatedPerHour(selected.Validated_per_hour);
        }
        validateVarenummer();
        validateValidatedPerHour();
        setHasInteractedPOrder(true);

    };

    const handleValidatedPerHourChange = (e) => {
        setValidatedPerHour(e.target.value);
        setHasInteractedValidatedPerHour(false);
    };

    const handleVarenummerChange = (e) => {
        setVarenummer(e.target.value);
        setHasInteractedVarenummer(false);
    };

    const validateValidatedPerHour = () => {
        setHasInteractedValidatedPerHour(true);
        const validatedPerHourPattern = /^\d{1,4}$/;
        setIsValidatedPerHourValid(validatedPerHourPattern.test(validatedPerHour));
    };

    const validateVarenummer = () => {
        setHasInteractedVarenummer(true);
        const varenummerPattern = /^\d{7}$/;
        setIsVarenummerValid(varenummerPattern.test(varenummer));
    };

    useEffect(() => {
        if (selectedOrder) {
            validateVarenummer();
            validateValidatedPerHour();
        }

    }, [selectedOrder]);

    // Print the Varenummer of the selected order
    return (
        <div className='primaryModal subModal'>
            <div className='container-row'>
                <button className='primary_modal_exit_button' onClick={handleModalCloseEmptyInputs}>
                    X
                </button>
                <div className='container-column'>
                    <h2 className='primary_modal_header'>Rediger P-Ordre</h2>
                    <form onSubmit={handleSubmit}>
                        <Card className='p-order-form-outer-container'>
                            <div className='select-p-order'>
                                <div className='select-p-order-input'>
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
                                    <div className='p-order-form-inner-container'>
                                        <Text className='input-field-header'>Varenummer</Text>
                                        <div className='checkmark-container'>
                                            <div className="checkmark-wrapper">
                                                {isVarenummerValid && hasInteractedVarenummer && (
                                                    <i className="fa fa-check text-success checkmark"></i>
                                                )}
                                            </div>
                                            <div className="input-wrapper">
                                                <div className="input-container">
                                                    <TextInput
                                                        className="text-input-field-p-order input-limited-width"
                                                        disabled={!selectedOrder}
                                                        required
                                                        placeholder="XXXXXXX"
                                                        value={varenummer}
                                                        onChange={handleVarenummerChange}
                                                        onBlur={validateVarenummer}
                                                        error={!isVarenummerValid && hasInteractedVarenummer}
                                                        errorMessage={
                                                            isVarenummerValid === false
                                                                ? "Skal være 7 cifre"
                                                                : ""
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='p-order-form-inner-container'>
                                        <Text className='input-field-header'>Valideret pr. time</Text>
                                        <div className='checkmark-container'>
                                            <div className="checkmark-wrapper">
                                                {isValidatedPerHourValid && hasInteractedValidatedPerHour && (
                                                    <i className="fa fa-check text-success checkmark"></i>
                                                )}
                                            </div>
                                            <div className="input-wrapper">
                                                <div className="input-container">
                                                    <TextInput
                                                        className="text-input-field-p-order input-limited-width"
                                                        disabled={!selectedOrder}
                                                        required
                                                        placeholder="XXXX"
                                                        value={validatedPerHour}
                                                        onChange={handleValidatedPerHourChange}
                                                        onBlur={validateValidatedPerHour}
                                                        error={!isValidatedPerHourValid && hasInteractedValidatedPerHour}
                                                        errorMessage={
                                                            isValidatedPerHourValid === false
                                                                ? "Skal være et tal mellem 1 og 9999"
                                                                : ""
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='p-order-form-inner-container'>
                                        <Text className='input-field-header'>Maskine</Text>
                                        <div className='checkmark-container'>
                                            <div className="checkmark-wrapper">
                                                <i className="fa fa-check text-success checkmark"></i>
                                            </div>
                                            <div className="input-wrapper">
                                                <div className='input-container'>
                                                    <TextInput className='text-input-field-p-order input-limited-width' disabled value={machineName} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.2vh' }}>
                            <div>
                                <Button size="lg" variant="primary" disabled={!(selectedOrder && isValidatedPerHourValid && isVarenummerValid)}>
                                    Registrer
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
        </div>
    );
};

export default EditPOrder;