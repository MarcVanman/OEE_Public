import MachineShow from './MachineShow';
import useMachineContext from '../hooks/use-machine-context';
import { useEffect, useState } from 'react';
import axios from 'axios';

function MachineList() {
  const { machines, setMachines, getAllItems } = useMachineContext();

  // Initialize currentOrder with an empty array
  const [currentOrder, setCurrentOrder] = useState([]);

  useEffect(() => {
    const localData = localStorage.getItem('machines');
    if (localData) {
      const parsedData = JSON.parse(localData);
      parsedData.sort((a, b) => a.orderIndex - b.orderIndex);
      setMachines(parsedData);
    } else {
      getAllItems({ table: 'OEE-Machines', all: true })
        .then(sortedData => {
          sortedData.sort((a, b) => a.orderIndex - b.orderIndex);
          setMachines(sortedData);
          setCurrentOrder(sortedData);
          localStorage.setItem('machines', JSON.stringify(sortedData));
        });
    }
  }, [getAllItems, setMachines]);

  useEffect(() => {
    const sortedData = [...machines];
    sortedData.sort((a, b) => a.orderIndex - b.orderIndex);
    setCurrentOrder(sortedData);
  }, [machines]);


  useEffect(() => {
    localStorage.setItem('machines', JSON.stringify(machines));
  }, [machines]);

  const onMoveUp = async (id) => {
    const index = currentOrder.findIndex((machine) => machine.id === id);
    const newIndex = index === 0 ? currentOrder.length - 1 : index - 1;
    const newOrder = Array.from(currentOrder);
    const [machine] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, machine);

    // Update the orderIndex of each machine in newOrder
    newOrder.forEach((machine, index) => {
      machine.orderIndex = index.toString();
    });

    try {
      const response = await axios.put("https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/machines/order", newOrder);
      if (response.status === 200) {
        setCurrentOrder(newOrder);
      } else {
        console.log('Error updating machine order', response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onMoveDown = async (id) => {
    const index = currentOrder.findIndex((machine) => machine.id === id);
    const newIndex = index === currentOrder.length - 1 ? 0 : index + 1;
    const newOrder = Array.from(currentOrder);
    const [machine] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, machine);

    // Update the orderIndex of each machine in newOrder
    newOrder.forEach((machine, index) => {
      machine.orderIndex = index.toString();
    });

    const response = await axios.put("https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/machines/order", newOrder);
    if (response.status === 200) {
      setCurrentOrder(newOrder);
    } else {
      console.log('Error updating machine order', response);
    }
  };

  return (
    <div>
    <h2 className='machine-list-header'>OEE System</h2>
    <ul className="machine-list">
      {currentOrder.map((machine, index) => (
        <li key={machine.id}>
          <MachineShow
            machine={machine}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        </li>
      ))}
    </ul>
    </div>
  );
}


export default MachineList;
