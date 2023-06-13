import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import useMachineContext from '../hooks/use-machine-context';
import PrimaryModalContext from '../contexts/PrimaryModalContext';
import useListenForButtonPress from '../reusable_functions/listenForButtonPress';
import 'dayjs/locale/da';
import { SelectBox, SelectBoxItem } from "@tremor/react";
import { DropdownItem, Dropdown } from "@tremor/react";
import { Card, Text, Col } from "@tremor/react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell
} from "@tremor/react";
import { Button } from "@tremor/react";
import SuccessModal from '../modals/SuccessModal';
import ErrorModal from '../modals/ErrorModal';

// Add handling of several stop sections
const today = new Date();  // get today's date

const filterByCreationDate = (returnedPOrders, createdDaysAgo) => {
  return returnedPOrders.filter(order => {
    const creationDate = new Date(order.CreationDate);
    const differenceInTime = today - creationDate;
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays <= createdDaysAgo;
  });
};

function EditDaily() {
  const primaryModalContext = useContext(PrimaryModalContext);

  const { showRegisterTimeModal, handleRegisterTimeClose, selectedMachine, pOrders, setPOrders, getAllItems } = useMachineContext();
  const { setEditDailyModalOpen } = primaryModalContext;
  const [selectedPOrder, setSelectedPOrder] = useState(null);
  const [shift, setShift] = useState('');
  const [dateSelected, setDateSelected] = useState('');
  const [isPOrderChosen, setIsPOrderChosen] = useState(false);
  const [isShiftChosen, setIsShiftChosen] = useState(false);
  const [isDateChosen, setIsDateChosen] = useState(false);
  const [isItemChosen, setIsItemChosen] = useState(false);
  const [dailyNumbers, setDailyNumbers] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueShifts, setUniqueShifts] = useState([]);
  const [dailyNumbersForSelectedPOrder, setDailyNumbersForSelectedPOrder] = useState([]);
  const [dailyRegistrationsGivenFilters, setDailyRegistrationsGivenFilters] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);



  useEffect(() => {
    const fetchPOrderData = async () => {
      const responseData = await getAllItems({
        all: true,
        table: 'OEE-P-Orders'
      });
      console.log('fetching pOrders', responseData);
      const filteredPOrders = filterByCreationDate(responseData, 60);

      // Sort the filteredPOrders by CreationDate
      filteredPOrders.sort((a, b) => a.CreationDate < b.CreationDate ? 1 : (a.CreationDate > b.CreationDate ? -1 : 0));

      console.log('P-Orders after date filtering', filteredPOrders);
      setPOrders(filteredPOrders);
    };

    const fetchRegistrationData = async () => {
      const responseData = await getAllItems({
        all: true,
        table: 'OEE-Daily-Numbers'
      });
      console.log('fetching daily numbers', responseData);
      const filteredDailyNumbers = responseData.filter(dailyNumber => dailyNumber.Machine === selectedMachine.id);
      setDailyNumbers(filteredDailyNumbers);
    };

    fetchPOrderData();
    fetchRegistrationData();

  }, [getAllItems, selectedMachine.id, setPOrders]);

  const inputIsGiven = (value, setter) => {
    if (value) {
      setter(true);
    } else {
      setter(false);
    }
  };

  const clearInputs = () => {
    setSelectedPOrder('');
    setShift('');
    setIsPOrderChosen(false);
    setIsShiftChosen(false);
    setDateSelected('');
  };

  const handleModalClose = () => {
    clearInputs();
    setEditDailyModalOpen(false);
    setShowSuccessModal(false);
  };

  const handleSuccessModalClose = () => {
    handleModalClose();
  };

  const handleErrorModalClose = () => {
    clearInputs();
    setShowErrorModal(false);
  };

  useListenForButtonPress(27, handleModalClose, showRegisterTimeModal);

  const handleCancelClick = (e) => {
    e.preventDefault();
    handleModalClose();
  };

  const handleSelectItem = (event, item) => {
    if (event.target.checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };


  // Implement deletion of selected items
  const handleDeleteClick = async (e) => {
    e.preventDefault();
    if (selectedItems.length > 0) {
      for (const item of selectedItems) {
        try {
          const response = await axios.delete(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/daily-numbers/${item.id}`);
          console.log('Response from delete request:', response);

          // Delete related records in the 'OEE-Stop-Registrations' table
          const relatedResponse = await axios.delete(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/stop-registrations/${item.id}`);
          console.log('Response from related delete request:', relatedResponse);
          setShowSuccessModal(true);
        } catch (error) {
          console.error('Failed to delete item:', error);
        }
      };
    };
  };


  const filterByMachine = (pOrders, selectedMachine) => {
    return pOrders.filter((pOrder) => pOrder.Machine === selectedMachine.id);
  };
  const filteredPOrders = filterByMachine(pOrders, selectedMachine);


  useEffect(() => {
    if (isPOrderChosen) {
      // Get daily numbers for selected P-Order
      const dailyNumbersForPOrder = dailyNumbers.filter(dailyNumber => dailyNumber.P_Order === selectedPOrder);
      setDailyNumbersForSelectedPOrder(dailyNumbersForPOrder);

      // Get shift from dailyNumbersForSelectedPOrder
      setUniqueShifts([...new Set(dailyNumbersForPOrder.map(dailyNumber => dailyNumber.Shift))])

    }
  }, [isPOrderChosen, dailyNumbers, selectedPOrder]);

  useEffect(() => {
    if (isShiftChosen) {
      // Get unique values of "Date" from dailyNumbersForSelectedPOrder where Shift is the selected shift
      const filteredDates = dailyNumbersForSelectedPOrder.filter(dailyNumber => dailyNumber.Shift === shift);
      setUniqueDates([...new Set(filteredDates.map(dailyNumber => dailyNumber.Date))])
    }
  }, [isShiftChosen, dailyNumbersForSelectedPOrder, shift]);

  useEffect(() => {
    if (isDateChosen) {
      // Get daily registrations for selected P-Order, Shift and Date
      const filteredDailyRegistrations = dailyNumbersForSelectedPOrder.filter(dailyNumber => dailyNumber.Date === dateSelected);
      setDailyRegistrationsGivenFilters(filteredDailyRegistrations);
    }
  }, [isDateChosen, dailyNumbersForSelectedPOrder, dateSelected]);

  useEffect(() => {
    setIsItemChosen(selectedItems.length > 0);
  }, [selectedItems]);



  let registrationContent = null;


  console.log('selectedItems', selectedItems);

  if (isDateChosen) {
    registrationContent = (
      <div className='Registrations'>
        <h2>
          Registreringer:
        </h2>
        <Card>
          <Table className="mt-5">
            <TableHead>
              <TableRow>
                <TableHeaderCell className='text-center'>Vælg</TableHeaderCell>
                <TableHeaderCell className='text-center'>P-Order</TableHeaderCell>
                <TableHeaderCell className='text-center'>Varenummer</TableHeaderCell>
                <TableHeaderCell className='text-center'>Dato</TableHeaderCell>
                <TableHeaderCell className='text-center'>Produceret</TableHeaderCell>
                <TableHeaderCell className='text-center'>Kasseret</TableHeaderCell>
                <TableHeaderCell className='text-center'>Skift</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyRegistrationsGivenFilters.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='text-center'>
                    <input
                      type="checkbox"
                      onChange={(event) => handleSelectItem(event, item)}
                    />
                  </TableCell>
                  <TableCell className='text-center'>{item.P_Order}</TableCell>
                  <TableCell className='text-center'>{item.Varenummer}</TableCell>
                  <TableCell className='text-center'>{item.Date}</TableCell>
                  <TableCell className='text-center'>{item.Produced_parts}</TableCell>
                  <TableCell className='text-center'>{item.Discarded_parts}</TableCell>
                  <TableCell className='text-center'>{item.Shift}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    )
  };

  return (
    <div className='primaryModal subModal registerTimeModal'>
      <button className='primary_modal_exit_button' onClick={handleModalClose}>
        X
      </button>
      <div className="modal-container">
        <h2 className='primary_modal_header'>Slet registrering for {selectedMachine.name}</h2>
        <form onSubmit={handleDeleteClick}>
          <div className="custom-grid-static-delete">
            <Col numColSpanLg={4}>
              <Card className='delete-registration-porder-card'>
                <div className='register-time-form-inner-container'>
                  <div className='select-p-order-container'>
                    <Text className='input-field-header'>P-Ordre nummer</Text>
                    <SelectBox
                      className='p-order-dropdown'
                      required
                      value={selectedPOrder}
                      onValueChange={(pOrder) => {
                        setSelectedPOrder(pOrder);
                        setShift(null);
                        setDateSelected(null);
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
                </div>
                <div className='register-time-form-inner-container'>
                  <div className='select-p-order-container'>
                    <Text className='input-field-header'>Skift</Text>
                    <Dropdown
                      className='p-order-dropdown'
                      value={shift}
                      disabled={!isPOrderChosen}
                      onValueChange={(value) => {
                        setShift(value);
                        setDateSelected(null);
                        inputIsGiven(value, setIsShiftChosen);
                      }}>
                      {uniqueShifts.length ? (
                        uniqueShifts.map((item) => (
                          <DropdownItem className='select-p-order' key={item} value={item} text={item} />
                        ))
                      ) : (
                        <DropdownItem className='select-p-order' disabled text={"Ingen registreringer foretaget"} />
                      )}
                    </Dropdown>
                  </div>
                </div>
                <div className='register-time-form-inner-container'>
                  <div className='select-p-order-container'>
                    <Text className='input-field-header'>Dato</Text>
                    <SelectBox
                      className='p-order-dropdown'
                      value={dateSelected}
                      disabled={!(isPOrderChosen && isShiftChosen)}
                      onValueChange={(value) => {
                        setDateSelected(value);
                        inputIsGiven(value, setIsDateChosen);
                      }}>
                      {uniqueDates.length ? (
                        uniqueDates.map((item) => (
                          <SelectBoxItem className='select-p-order' key={item} value={item} text={item} />
                        ))
                      ) : (
                        <SelectBoxItem className='select-p-order' disabled text={"Ingen registreringer foretaget"} />
                      )}
                    </SelectBox>
                  </div>
                </div>
              </Card>
            </Col>
          </div>
          {registrationContent}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '70px' }}>
            <div>
              <Button size="xl" variant="primary" disabled={!(isItemChosen)}>
                Slet
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
      </div >
    </div >
  );
}

export default EditDaily;