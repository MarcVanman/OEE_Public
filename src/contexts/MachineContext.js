import React, { createContext, useState, useCallback } from 'react';
import AWS from 'aws-sdk';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';


const MachineContext = createContext();

function MachineProvider({ children }) {

  const [machines, setMachines] = useState([]);
  const [pOrders, setPOrders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPrimaryModal, setShowPrimaryModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showRegisterTimeModal, setShowRegisterTimeModal] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteMachineModal, setShowDeleteMachineModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [showPOrderModal, setShowPOrderModal] = useState(false);

  const getAllItems = useCallback(async (parameters, attributes = null) => {
    const params = { ...parameters };
    if (attributes) {
      params.attributes = attributes.join(',');
    }
    const response = await axios.get('https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com', {
      params,
    });
    return response.data;
  }, []);


  const postItem = useCallback(async (parameters) => {
    const response = await axios.post('https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com', {
      ...parameters
    });
    return response.data;
  }, []);

  const s3 = new AWS.S3({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1',
  });

  const uploadToS3 = async (file, key) => {
    const params = {
      Bucket: 'oeestoragebucket',
      Key: `MachineImages/${key}`,
      Body: file,
      ContentEncoding: 'base64',
      ContentType: file.type
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      });
    });
  };


  const createMachine = async (name, imageFile, machineType, machineSize) => {
    try {
      const imageKey = `${name}_${Date.now()}.${imageFile.name.split('.').pop()}`;
      const imageUrl = await uploadToS3(imageFile, imageKey);

      const id = uuidv4();

      const response = await postItem({
        id,
        name,
        imageUrl,
        machineType,
        machineSize,
        table: "OEE-Machines",
        createdDate: new Date().toISOString(),
      });
      console.log('Created machine:', response);
      const updatedMachines = [...machines, response.data];
      setMachines(updatedMachines);
      setShowCreate(false);
      setShowAddMachine(true);
    } catch (error) {
      console.error('Failed to create machine:', error);
      // Display an error message to the user
    }
  };

  const cancelCreateMachine = () => {
    setShowAddMachine(true);
    setShowCreate(false);
  };

  const handleModalClose = () => {
    setShowDeleteMachineModal(false);
    setShowPrimaryModal(false);
    setShowRegisterTimeModal(false);
    setShowPOrderModal(false);
    setShowEdit(false);
  };

  const handleRegisterTimeClick = () => {
    setShowRegisterTimeModal(true);
  };

  const handleRegisterTimeClose = () => {
    setShowRegisterTimeModal(false);
  };

  const handlePOrderClick = () => {
    setShowPOrderModal(true);
  };

  const handlePOrderClose = () => {
    setShowPOrderModal(false);
  };

  const handleDeleteMachineClose = () => {
    setShowDeleteMachineModal(false);
  };

  const deleteMachineById = async (id) => {
    try {
      const response = await axios.put(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/${id}`, {
        table_name: "OEE-Machines",
        depreciated: "True"
      });
      //const response = await axios.delete(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/OEE-Machines/${id}`);
      if (response.status === 200) {
        console.log('Machine deleted successfully!')
        const updatedMachines = machines.filter((machine) => machine.id !== id);
        setMachines(updatedMachines);
      } else {
        console.error('Failed to delete machine:', response);
      }
    } catch (error) {
      console.error('Failed to delete machine:', error);
    }
  };



  const editMachineById = async (id, newName, imageUrl) => {
    try {
      let response = null;
      response = await axios.put(`https://ukprj5plf5.execute-api.eu-central-1.amazonaws.com/${id}`, {
        name: newName,
        imageUrl: imageUrl,
        table_name: "OEE-Machines"
      });
      console.log('response', response)
      if (response.status === 200) {
        const updatedMachines = machines.map((machine) => {
          if (machine.id === id) {
            return { ...machine, ...response.data.machine };
          }
          return machine;
        });
        setMachines(updatedMachines);
        setSelectedMachine(prevMachine => ({
          ...prevMachine,
          name: newName
        }))
      }
      else {
        console.error('Failed to edit machine:', response);
      }
      handleModalClose();
    } catch (error) {
      console.error('Failed to edit machine:', error);
    }
  };


  const handleClickModal = (machine) => {
    setShowPrimaryModal(true);
    setSelectedMachine(machine);
  };


  const values_to_share = {
    machines,
    setMachines,
    pOrders,
    setPOrders,
    selectedMachine,
    setSelectedMachine,
    showPrimaryModal,
    setShowPrimaryModal,
    showRegisterTimeModal,
    setShowRegisterTimeModal,
    handleModalClose,
    handleRegisterTimeClose,
    handleRegisterTimeClick,
    editMachineById,
    deleteMachineById,
    createMachine,
    cancelCreateMachine,
    showCreate,
    setShowCreate,
    showAddMachine,
    setShowAddMachine,
    handleClickModal,
    showEdit,
    setShowEdit,
    handleDeleteMachineClose,
    setShowDeleteMachineModal,
    showDeleteMachineModal,
    s3,
    uploadToS3,
    imageFile,
    setImageFile,
    handlePOrderClick,
    handlePOrderClose,
    showPOrderModal,
    getAllItems,
    postItem,
    registrations,
    setRegistrations,
  };

  return (
    <MachineContext.Provider value={values_to_share}>
      {children}
    </MachineContext.Provider>
  )
};

export { MachineProvider };
export default MachineContext;
