import { useState, useRef, useEffect } from 'react';
import useMachineContext from '../hooks/use-machine-context';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import 'dayjs/locale/da';
import { utcToZonedTime } from 'date-fns-tz';
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TextInput, DropdownItem, Dropdown } from "@tremor/react";
import { SelectBox, SelectBoxItem } from "@tremor/react";
import { Card, Text, Col } from "@tremor/react";
import { Button } from "@tremor/react";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';


// Add handling of several stop sections
const today = new Date();  // get today's date
const createdDaysAgo = 60;  // calculate date 60 days ago

function getCopenhagenDate(date) {
  const copenhagenTimeZone = 'Europe/Copenhagen';
  const copenhagenDate = utcToZonedTime(date, copenhagenTimeZone);
  return copenhagenDate;
}

const filterByCreationDate = (returnedPOrders, createdDaysAgo) => {
  return returnedPOrders.filter(order => {
    const creationDate = new Date(order.CreationDate);
    const differenceInTime = today - creationDate;
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays <= createdDaysAgo;
  });
};

function useScrollToAddButton(ref, callback, scrollToAddStop) {
  useEffect(() => {
    if (scrollToAddStop) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      if (typeof callback === 'function') {
        callback();
      }
    }
  }, [ref, callback, scrollToAddStop]);
}

function RegisterTimeModal() {
  const contentRef = useRef();


  const now = new Date()
  const formattedDateNow = now.toISOString().slice(0, 10);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const formattedDateTimeOneHourAgo = oneHourAgo.toISOString().slice(0, 16);

  const { showRegisterTimeModal, handleRegisterTimeClose, selectedMachine, pOrders, setPOrders, postItem, getAllItems } = useMachineContext();
  const [selectedPOrder, setSelectedPOrder] = useState(null);
  const [shift, setShift] = useState('');

  const [discarded, setDiscarded] = useState('');
  const [produced, setProduced] = useState('');
  const [productionTimeStart, setProductionTimeStart] = useState(dayjs(getCopenhagenDate(new Date().setHours(6, 45, 0, 0))));
  const [productionTimeEnd, setProductionTimeEnd] = useState(dayjs(getCopenhagenDate(new Date().setHours(15, 0, 0, 0))));
  const [dateSelected, setDateSelected] = useState(dayjs(formattedDateNow));
  const [isDiscardedValid, setIsDiscardedValid] = useState(null);
  const [isProducedValid, setIsProducedValid] = useState(null);
  const [hasDiscardedInteracted, setHasDiscardedInteracted] = useState(false);
  const [hasProducedInteracted, setHasProducedInteracted] = useState(false);
  const [stops, setStops] = useState([]);
  const [scrollToAddStop, setScrollToAddStop] = useState(false);
  const [isPOrderChosen, setIsPOrderChosen] = useState(false);
  const [isShiftChosen, setIsShiftChosen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [localTimeValues, setLocalTimeValues] = useState({});


  useEffect(() => {
    const fetchData = async () => {
      const responseData = await getAllItems({
        all: true,
        table: 'OEE-P-Orders'
      });
      console.log('fetching pOrders', responseData);
      const filteredPOrders = filterByCreationDate(responseData, createdDaysAgo);
      filteredPOrders.sort((a, b) => a.CreationDate < b.CreationDate ? 1 : (a.CreationDate > b.CreationDate ? -1 : 0));

      console.log('P-Orders after date filtering', filteredPOrders)
      setPOrders(filteredPOrders);
    };
    fetchData();
  }, [getAllItems, setPOrders]);

  const inputIsGiven = (value, setter) => {
    if (value) {
      setter(true);
    } else {
      setter(false);
    }
  };

  const refAddStopButton = useRef(null);
  useScrollToAddButton(refAddStopButton, () => setScrollToAddStop(false), scrollToAddStop);

  const addStop = () => {
    const newStop = {
      id: stops.length,
      stopReason: "",
      startTime: dayjs(formattedDateTimeOneHourAgo),
      endTime: dayjs(formattedDateTimeOneHourAgo),
    };

    setStops([...stops, newStop]);
    setScrollToAddStop(true);
  };

  const clearInputs = () => {
    setDiscarded('');
    setProduced('');
    setSelectedPOrder('');
    setShift('');
    setStops([]);
    setIsPOrderChosen(false);
    setIsShiftChosen(false);
    setHasDiscardedInteracted(false);
    setHasProducedInteracted(false);
    setIsDiscardedValid(null);
    setIsProducedValid(null);
    setDateSelected(dayjs(formattedDateNow));
  };

  const handleModalClose = () => {
    handleRegisterTimeClose();
    clearInputs();
    setShowSuccessModal(false);
  };

  const scrollToTop = () => {
    if (contentRef && contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.classList.add('no-scroll');
    }
  };


  const handleSuccessModalClose = () => {
    handleModalClose();
  };

  const handleErrorModalClose = () => {
    setStops([]);
    setShowErrorModal(false);
    contentRef.current.classList.remove('no-scroll');
  };

  useListenForButtonPress(27, handleModalClose, showRegisterTimeModal);

  const handleCancelClick = (e) => {
    e.preventDefault();
    handleModalClose();
  };

  const validateNumberInput = (stateVariable, setFunction, setFunctionInteracted) => {
    setFunctionInteracted(true);
    const numberPattern = /^\d{1,4}$/;
    setFunction(numberPattern.test(stateVariable));
  };

  const handleDiscardedChange = (e) => {
    setDiscarded(e.target.value);
    setHasDiscardedInteracted(false)
  };

  const handleProducedChange = (e) => {
    setProduced(e.target.value);
    setHasProducedInteracted(false)
  };

  const handleProductionTimeChange = (value, timeKey) => {
    if (timeKey === 'productionTimeStart') {
      setProductionTimeStart(value);
    } else {
      setProductionTimeEnd(value);
    }
  };

  const handleStopTimeChange = (value, index, timeKey) => {
    if (!value) { // If the value is empty
      const updatedStops = [...stops];
      updatedStops[index] = {
        ...updatedStops[index],
        [timeKey]: null,  // Set the time field to null
      };
      setStops(updatedStops);
      return;
    }
    // If the value is not empty, keep the local time values
    setLocalTimeValues((prevState) => ({
      ...prevState,
      [`${index}_${timeKey}`]: value,
    }));
  };

  const handleTimeBlur = (index, timeKey) => {
    const value = localTimeValues[`${index}_${timeKey}`];

    const updatedTime = dayjs(value, 'HH:mm');
    if (!updatedTime.isValid()) { // If the updatedTime is invalid, we just return to avoid any calculations
      return;
    }

    const updatedStops = [...stops];
    let newTime = dayjs(stops[index]?.[timeKey]);

    // Check if newTime is valid. If not, initialize it to the current time
    if (!newTime.isValid()) {
      newTime = dayjs();
    }

    const formattedNewTime = newTime
      .hour(updatedTime.hour())
      .minute(updatedTime.minute());

    updatedStops[index] = {
      ...updatedStops[index],
      [timeKey]: formattedNewTime,
    };
    setStops(updatedStops);
  };

  // Validate that the stop time is within the production time
  const validateTimeInput = () => {
    const productionTimeStartHour = productionTimeStart.hour();
    const productionTimeStartMinute = productionTimeStart.minute();
    const productionTimeEndHour = productionTimeEnd.hour();
    const productionTimeEndMinute = productionTimeEnd.minute();

    const productionTimeStartInMinutes = productionTimeStartHour * 60 + productionTimeStartMinute;
    const productionTimeEndInMinutes = productionTimeEndHour * 60 + productionTimeEndMinute;

    const stopsValidated = stops.map((stop) => {
      const stopStartHour = stop.startTime.hour();
      const stopStartMinute = stop.startTime.minute();
      const stopEndHour = stop.endTime.hour();
      const stopEndMinute = stop.endTime.minute();

      const stopStartInMinutes = stopStartHour * 60 + stopStartMinute;
      const stopEndInMinutes = stopEndHour * 60 + stopEndMinute;

      if (stopStartInMinutes < productionTimeStartInMinutes || stopEndInMinutes > productionTimeEndInMinutes) {
        return false;
      } else {
        return true;
      }
    });

    const isTimeValid = stopsValidated.every((stop) => stop === true);
    return isTimeValid;
  };

  //Set the production time start and end to 15:00 and 23:00 if shift is Aftenhold
  useEffect(() => {
    if (shift === 'Aftenhold') {
      setProductionTimeStart(dayjs(getCopenhagenDate(new Date().setHours(15, 0, 0, 0))));
      setProductionTimeEnd(dayjs(getCopenhagenDate(new Date().setHours(23, 0, 0, 0))));
    }
    else if (shift === 'Daghold') {
      setProductionTimeStart(dayjs(getCopenhagenDate(new Date().setHours(6, 45, 0, 0))));
      setProductionTimeEnd(dayjs(getCopenhagenDate(new Date().setHours(15, 0, 0, 0))));
    }
  }, [shift]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const registration_id = uuidv4();
    scrollToTop();
    if (validateTimeInput()) {
      setIsPOrderChosen(false);
      setIsShiftChosen(false);
      // Gather data for the OEE-Daily-Numbers table

      const dailyNumbersData = {
        id: registration_id,
        P_Order: selectedPOrder,
        Varenummer: filteredPOrders.filter((pOrder) => pOrder.P_Order === selectedPOrder)[0].Varenummer,
        Machine: selectedMachine.id,
        Produced_parts: produced,
        Discarded_parts: discarded,
        Shift: shift,
        Date: dateSelected.format('DD-MM-YYYY'),
        Production_Start_time: productionTimeStart.format('HH:mm'),
        Production_End_time: productionTimeEnd.format('HH:mm'),
        CreationDate: dayjs(new Date()).format('DD-MM-YYYY HH:mm:ss'),
        table: "OEE-Daily-Numbers",
      };

      // Post data to the OEE-Daily-Numbers table
      try {
        const dailyNumbersResponse = await postItem(dailyNumbersData);
        console.log("Daily Numbers Response:", dailyNumbersResponse);
      } catch (error) {
        console.error("Error posting daily numbers:", error);
      }

      // Iterate through the list of stops and gather data for the OEE-Stop-Registrations table
      for (const stop of stops) {
        const id = uuidv4();
        console.log('stop times', stop.startTime.format('HH:mm'), stop.endTime.format('HH:mm'))
        const stopRegistrationData = {
          id: id,
          Registration_id: registration_id,
          P_Order: selectedPOrder,
          Varenummer: filteredPOrders.filter((pOrder) => pOrder.P_Order === selectedPOrder)[0].Varenummer,
          Machine: selectedMachine.id,
          Shift: shift,
          Date: dateSelected.format('DD-MM-YYYY'),
          Start_time: stop.startTime.format('HH:mm'),
          End_time: stop.endTime.format('HH:mm'),
          Reason: stop.stopReason,
          CreationDate: dayjs(new Date()).format('DD-MM-YYYY HH:mm:ss'),
          table: "OEE-Stop-Registrations",
        };

        // Post data to the OEE-Stop-Registrations table

        try {
          const stopRegistrationResponse = await postItem(stopRegistrationData);
          console.log("Stop Registration Response:", stopRegistrationResponse);
        } catch (error) {
          console.error("Error posting stop registration:", error);
        }

      }

      // Reset the form fields and close the modal
      setShowSuccessModal(true);

    } else {
      setShowErrorModal(true);
    }
  };

  const filterByMachine = (pOrders, selectedMachine) => {
    return pOrders.filter((pOrder) => pOrder.Machine === selectedMachine.id);
  };
  const filteredPOrders = filterByMachine(pOrders, selectedMachine);

  let discardedInputComponent = (
    <div className="input-wrapper">
      <TextInput
        className="text-input-field-register-time input-limited-width"
        required
        placeholder="Antal"
        value={discarded}
        onChange={handleDiscardedChange}
        onBlur={() => validateNumberInput(discarded, setIsDiscardedValid, setHasDiscardedInteracted)}
        error={!isDiscardedValid && hasDiscardedInteracted}
        errorMessage={
          isDiscardedValid === false ? "Skal være et tal mellem 1-10.000" : ""
        }
      />
      {isDiscardedValid && hasDiscardedInteracted && (
        <i className="fa fa-check text-success checkmark"></i>
      )}
    </div>
  )

  let producedInputComponent = (
    <div className="input-wrapper ">
      <TextInput
        className="text-input-field-register-time input-limited-width"
        required
        placeholder="Antal"
        value={produced}
        onChange={handleProducedChange}
        onBlur={() => validateNumberInput(produced, setIsProducedValid, setHasProducedInteracted)}
        error={!isProducedValid && hasProducedInteracted}
        errorMessage={
          isProducedValid === false ? "Skal være et tal mellem 1-10.000" : ""
        }
      />
      {isProducedValid && hasProducedInteracted && (
        <i className="fa fa-check text-success checkmark"></i>
      )}
    </div>
  )

  let productionTimeComponent = (
    <div className='register-time-form-container'>
      <Stack direction="row" spacing={2}>
        <div className='register-time-form-inner-container' style={{ 'textAlign': 'center' }}>
          <Text className='input-field-header'>Produktions tid</Text>
          <div className='time-container'>
            <div className='start-time'>
              <TimeField
                className='time-inputbox'
                label="Start tid for produktion"
                value={productionTimeStart}
                onChange={(value) => handleProductionTimeChange(value, 'productionTimeStart')}
              />
            </div>
            -
            <div className='end-time'>
              <TimeField
                className='time-inputbox'
                label="Slut tid for produktion"
                value={productionTimeEnd}
                onChange={(value) => handleProductionTimeChange(value, 'productionTimeEnd')}
              />
            </div>
          </div>
        </div>
      </Stack>
    </div>
  )

  const allStopsHaveReason = () => stops.every(stop => stop.stopReason !== '');

  const renderStops = () => {
    return stops.map((stop, index) => (
      <div key={stop.id} className="custom-grid-dynamic">
        <Text className='stop-registration'>
          Stop {index + 1}
        </Text>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'da'}>
          <Col numColSpanLg={3}>
            <Card>
              <div className="register-time-form-container" style={{ 'textAlign': 'center' }}>
                <div className='register-time-form-inner-container'>
                  <Text className='input-field-header'>Stop årsag</Text>
                  <SelectBox
                    value={stop.stopReason}
                    onValueChange={(value) => {
                      const updatedStops = [...stops];
                      updatedStops[index] = {
                        ...updatedStops[index],
                        stopReason: value,
                      };
                      setStops(updatedStops);
                    }}
                  >
                    <SelectBoxItem value="Omstilling " text={"Omstilling"} />
                    <SelectBoxItem value="Manglende mandskab" text={"Manglende mandskab"} />
                    <SelectBoxItem value="Planlagt stop" text={"Planlagt stop"} />
                    <SelectBoxItem value="Opstart" text={"Opstart"} />
                    <SelectBoxItem value="Nedlukning" text={"Nedlukning"} />
                    <SelectBoxItem value="Andet" text={"Andet"} />
                    <SelectBoxItem value="Form" text={"Form"} />
                    <SelectBoxItem value="Stanseværktøj" text={"Stanseværktøj"} />
                    <SelectBoxItem value="Robot" text={"Robot"} />
                    <SelectBoxItem value="Maskine" text={"Maskine"} />
                    <SelectBoxItem value="Hjælpeværktøj" text={"Hjælpeværktøj"} />
                    <SelectBoxItem value="Køletunnel" text={"Køletunnel"} />
                    <SelectBoxItem value="Proces" text={"Proces"} />
                    <SelectBoxItem value="Procesafprøvning PRO" text={"Procesafprøvning PRO"} />
                    <SelectBoxItem value="Procesafprøvning PTA" text={"Procesafprøvning PTA"} />
                    <SelectBoxItem value="Fejl 40" text={"Fejl 40 ( menneskelige fejl)"} />
                    <SelectBoxItem value="Smøring" text={"Smøring"} />
                    <SelectBoxItem value="Form ikke klar" text={"Form ikke klar"} />
                    <SelectBoxItem value="Manglende emner" text={"Manglende emner"} />
                    <SelectBoxItem value="Manglende teknisk assistance" text={"Manglende teknisk assistance"} />
                  </SelectBox>
                </div>
              </div>
              <div className='register-time-form-container'>
                <Col numColSpanLg={2}>
                  <Stack direction="row" spacing={2}>
                    <div className='register-time-form-inner-container' style={{ 'textAlign': 'center' }}>
                      <Text className='input-field-header'>Tid</Text>
                      <div className='time-container'>
                        <div className='start-time'>
                          <TimeField
                            className='time-inputbox'
                            label="Start tid for stop"
                            value={stops[index]?.startTime}
                            onChange={(value) => handleStopTimeChange(value, index, 'startTime')}
                            onBlur={() => handleTimeBlur(index, 'startTime')}
                          />
                        </div>
                        -
                        <div className='end-time'>
                          <TimeField
                            className='time-inputbox'
                            label="Slut tid for stop"
                            value={stops[index]?.endTime}
                            onChange={(value) => handleStopTimeChange(value, index, 'endTime')}
                            onBlur={() => handleTimeBlur(index, 'endTime')}
                          />
                        </div>
                      </div>
                    </div>
                  </Stack>
                </Col>
              </div>
            </Card>
          </Col>
        </LocalizationProvider>
      </div>
    ));
  };

  if (!showRegisterTimeModal) {
    return null;
  }

  return (
    <div className='primaryModal subModal registerTimeModal' ref={contentRef}>
      <button className='primary_modal_exit_button' onClick={handleModalClose}>
        X
      </button>
      <div className="modal-container">
        <h2 className='primary_modal_header'>Daglig registrering for {selectedMachine.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="custom-grid-static">
            <Col numColSpanLg={4}>
              <Card className='select-porder-card'>
                <div className='register-time-form-inner-container center-and-equal-size'>
                  <div className='select-p-order-container'>
                    <Text className='input-field-header'>P-Ordre nummer</Text>
                    <SelectBox
                      className='p-order-dropdown'
                      required
                      value={selectedPOrder}
                      onValueChange={(pOrder) => {
                        setSelectedPOrder(pOrder);
                        inputIsGiven(pOrder, setIsPOrderChosen);
                      }}
                    >
                      {filteredPOrders.length ? (
                        filteredPOrders.map((item) => (
                          <SelectBoxItem className='select-p-order' key={item.P_Order} value={item.P_Order} text={item.P_Order.toString()} />
                        ))
                      ) : (
                        <SelectBoxItem className='select-p-order' disabled text={"Ingen P-Ordre oprettet på denne maskine"} />
                      )}
                    </SelectBox>
                  </div>
                  <div className='register-time-form-inner-container'>
                    <Text className='input-field-header'>Dato</Text>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'da'}>
                      <DatePicker
                        label="Dato for registrering"
                        format="DD/MM/YYYY"
                        value={dateSelected}
                        onChange={(value) => {
                          setDateSelected(value);
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                </div>
              </Card>
            </Col>
            <Col numColSpanLg={4}>
              <Card className='select-porder-card'>
                <div className='register-time-form-inner-container center-and-equal-size'>
                  <div className='register-time-form-inner-container'>
                    <Text className='input-field-header'>Skift</Text>
                    <Dropdown
                      value={shift}
                      onValueChange={(value) => {
                        setShift(value);
                        inputIsGiven(value, setIsShiftChosen);
                      }}>
                      <DropdownItem value="Daghold" text={"Daghold"} />
                      <DropdownItem value="Aftenhold" text={"Aftenhold"} />
                      <DropdownItem value="Nathold" text={"Nathold"} />
                    </Dropdown>
                  </div>
                </div>
              </Card>
            </Col>
            <Col numColSpanLg={2}>
              <Card>
                <div className='register-time-form-inner-container'>
                  <Text className='input-field-header'>Antal Produceret</Text>
                  {producedInputComponent}
                </div>
              </Card>
            </Col>
            <Col numColSpanLg={2}>
              <Card>
                <div className='register-time-form-inner-container'>
                  <Text className='input-field-header'>Antal Kasseret</Text>
                  {discardedInputComponent}
                </div>
              </Card>
            </Col>
            <Col numColSpanLg={4}>
              <Card>
                <div className='register-time-form-inner-container'>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'da'}>
                    {productionTimeComponent}
                  </LocalizationProvider>
                </div>
              </Card>
            </Col>
          </div>
          {renderStops()}
          <Text className='stop-registration'>
            Tilføj stop
          </Text>
          <div className='add-stop-container' ref={refAddStopButton}>
            <AddCircleIcon
              className='add-stop-icon'
              sx={{ fontSize: '45px' }}
              onClick={addStop}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '70px' }}>
            <div>
              <Button size="xl" variant="primary" disabled={!(isPOrderChosen && isShiftChosen && allStopsHaveReason())}>
                Registrer
              </Button>
            </div>
            <div style={{ marginLeft: '20px', marginBottom: '30px' }}>
              <Button size="xl" variant="secondary" onClick={handleCancelClick}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
        <ErrorModal showModal={showErrorModal} closeModal={handleErrorModalClose} />
        <SuccessModal showModal={showSuccessModal} closeModal={handleSuccessModalClose} />
      </div>
    </div>
  );
}

export default RegisterTimeModal;