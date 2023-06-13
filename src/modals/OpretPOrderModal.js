import React, { useState } from 'react';
import SuccessModal from './SuccessModal';
import axios from 'axios';
import useMachineContext from '../hooks/use-machine-context';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import { TextInput } from "@tremor/react";
import { Card, Text } from "@tremor/react";
import { Button } from "@tremor/react";

function POrderInput({ value, onChange, onBlur, error, errorMessage }) {
  return (
    <div className="input-container">
      <TextInput
        className="text-input-field-p-order input-limited-width"
        required
        placeholder="P-XXXXX"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        errorMessage={errorMessage}
      />
    </div>
  );
}

function ValidatedPerHourInput({ value, onChange, onBlur, error, errorMessage }) {
  return (
    <div className="input-container">
      <TextInput
        className="text-input-field-p-order input-limited-width"
        required
        placeholder="XXXX"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        errorMessage={errorMessage}
      />
    </div>
  );
}

function VarenummerInput({ value, onChange, onBlur, error, errorMessage }) {
  return (
    <div className="input-container">
      <TextInput
        className="text-input-field-p-order input-limited-width"
        required
        placeholder="XXXXXXX"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        errorMessage={errorMessage}
      />
    </div>
  );
}

function OpretPOrderModal() {
  const { showPOrderModal, handlePOrderClose, selectedMachine, postItem, pOrders, setPOrders } = useMachineContext();
  const [pOrderNumber, setPOrderNumber] = useState('');
  const [validatedPerHour, setValidatedPerHour] = useState('');
  const [varenummer, setVarenummer] = useState('');
  const [isPOrderNumberAvailable, setIsPOrderNumberAvailable] = useState(null);
  const [isPOrderNumberPatternValid, setIsPOrderNumberPatternValid] = useState(null);
  const [isPOrderNumberValid, setIsPOrderNumberValid] = useState(null);
  const [isValidatedPerHourValid, setIsValidatedPerHourValid] = useState(null);
  const [isVarenummerValid, setIsVarenummerValid] = useState(null);
  const [hasInteractedPOrder, setHasInteractedPOrder] = useState(false);
  const [hasInteractedValidatedPerHour, setHasInteractedValidatedPerHour] = useState(false);
  const [hasInteractedVarenummer, setHasInteractedVarenummer] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const getMachineType = async (machineId) => {
    console.log('machineId:', machineId)
    try {
      const response = await axios.get(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com`, {
        params: {
          id: machineId,
          table: "OEE-Machines"
        }
      });
      console.log('response.data.machineType:', response.data)
      if (response.data && response.data.machineType) {
        return response.data.machineType;
      }
    } catch (error) {
      console.error('Failed to get machine type:', error);
    }
  };

  const checkIsPOrderNumberAvailable = async (pOrderNumber, selectedMachine) => {
    try {
      const pOrderResponse = await axios.get(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com`, {
        params: {
          P_Order: pOrderNumber,
          table: "OEE-P-Orders"
        }
      });

      if (pOrderResponse.data.notFound) {
        return true;
      } else {
        const existingMachineType = await getMachineType(pOrderResponse.data.Machine);
        return existingMachineType !== selectedMachine.machineType;
      }
    } catch (error) {
      console.error('Failed to check if pOrder is available:', error);
    }
  };


  const handleModalCloseEmptyInputs = () => {
    setPOrderNumber('');
    setValidatedPerHour('');
    setVarenummer('');
    setIsPOrderNumberValid(null);
    setIsValidatedPerHourValid(null);
    setIsVarenummerValid(null);
    setHasInteractedPOrder(false);
    setHasInteractedValidatedPerHour(false);
    setHasInteractedVarenummer(false);
    setIsPOrderNumberAvailable(null);
    setIsPOrderNumberPatternValid(null);
    setShowSuccessModal(false);
    handlePOrderClose();
  };
  useListenForButtonPress(27, handleModalCloseEmptyInputs, showPOrderModal);

  const handleCancelClick = (e) => {
    e.preventDefault();
    handleModalCloseEmptyInputs();
  };

  if (!showPOrderModal) {
    return null;
  }
  const machineId = selectedMachine.id;
  const machineName = selectedMachine.name;

  const createPOrder = async () => {
    const response = await postItem({
      P_Order: pOrderNumber,
      Varenummer: varenummer,
      Validated_per_hour: validatedPerHour,
      Machine: machineId,
      CreationDate: new Date().toISOString(),
      table: "OEE-P-Orders"
    });
    console.log('Created pOrder:', response);
    const updatedPOrders = [...pOrders, response.data];

    // Sort updated pOrders by creation date, newest first
    updatedPOrders.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));
    setPOrders(updatedPOrders);
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    handleModalCloseEmptyInputs();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPOrderNumberValid && isValidatedPerHourValid && isVarenummerValid) {
      createPOrder();
    } else {
      console.log("One or all inputs are invalid");
    }
  };

  const handlePOrderChange = (e) => {
    setPOrderNumber(e.target.value.toUpperCase());
    setHasInteractedPOrder(false);
  };

  const handleValidatedPerHourChange = (e) => {
    setValidatedPerHour(e.target.value);
    setHasInteractedValidatedPerHour(false);
  };

  const handleVarenummerChange = (e) => {
    setVarenummer(e.target.value);
    setHasInteractedVarenummer(false);
  };

  const validatePOrderNumber = async () => {
    setHasInteractedPOrder(true);
    const isAvailable = await checkIsPOrderNumberAvailable(pOrderNumber, selectedMachine);
    const pOrderNumberPattern = /^P-\d{5}$/;
    const fitsPattern = pOrderNumberPattern.test(pOrderNumber);
    setIsPOrderNumberPatternValid(fitsPattern);
    setIsPOrderNumberAvailable(isAvailable);
    setIsPOrderNumberValid(fitsPattern === true && isAvailable === true);
  };

  const validateValidatedPerHour = () => {
    setHasInteractedValidatedPerHour(true);
    const validatedPerHourPattern = /^\d{1,4}$/;
    setIsValidatedPerHourValid(validatedPerHourPattern.test(validatedPerHour));
  };

  const validateVarenummer = () => {
    setHasInteractedVarenummer(true);
    const varenummerPattern = /^(\d{4}|\d{7})$/;
    setIsVarenummerValid(varenummerPattern.test(varenummer));
  };


  return (
    <div className='primaryModal subModal'>
      <div className='container-row'>
        <button className='primary_modal_exit_button' onClick={handleModalCloseEmptyInputs}>
          X
        </button>
        <div className='container-column'>
          <h2 className='primary_modal_header'>Opret P-Ordre for {machineName}</h2>
          <form onSubmit={handleSubmit}>
            <Card className='p-order-form-outer-container'>
              <div className='select-p-order'>
                <div className='select-p-order-input'>
                  <div className='p-order-form-inner-container'>
                    <Text className='input-field-header'>P-Ordre nummer</Text>
                    <div className='checkmark-container'>
                      <div className="checkmark-wrapper">
                        {isPOrderNumberValid && hasInteractedPOrder && isPOrderNumberPatternValid && (
                          <i className="fa fa-check text-success checkmark"></i>
                        )}
                      </div>
                      <div className="input-wrapper">
                        <POrderInput
                          value={pOrderNumber}
                          onChange={handlePOrderChange}
                          onBlur={validatePOrderNumber}
                          error={!isPOrderNumberValid && hasInteractedPOrder}
                          errorMessage={isPOrderNumberPatternValid === false ? "Skal være på formen P-XXXXX"
                            : isPOrderNumberAvailable === false
                              ? "P-Ordren findes allerede på en maskine af denne type (Støb/CNC)."
                              : ""
                          }
                        />
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
                        <VarenummerInput
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
                  <div className='p-order-form-inner-container'>
                    <Text className='input-field-header'>Valideret pr. time</Text>
                    <div className='checkmark-container'>
                      <div className="checkmark-wrapper">
                        {isValidatedPerHourValid && hasInteractedValidatedPerHour && (
                          <i className="fa fa-check text-success checkmark"></i>
                        )}
                      </div>
                      <div className="input-wrapper">
                        <ValidatedPerHourInput
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
                <Button size="lg" variant="primary" disabled={!(isPOrderNumberValid && isValidatedPerHourValid && isVarenummerValid)}>
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

export default OpretPOrderModal;