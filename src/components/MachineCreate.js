import { useState, useContext } from 'react';
import { MDBFile } from 'mdb-react-ui-kit';
import MachineContext from '../contexts/MachineContext';
import { TextInput } from "@tremor/react";
import { Flex, Card, Text } from "@tremor/react";
import { Button } from "@tremor/react";
import { Dropdown, DropdownItem } from "@tremor/react";

function MachineCreate() {

  const machineContext = useContext(MachineContext);
  const { createMachine, cancelCreateMachine, imageFile, setImageFile } = machineContext;


  const [name, setName] = useState('');
  const [imageUploaded, setImageUploaded] = useState(false);
  const [machineType, setMachineType] = useState(null);
  const [machineSize, setMachineSize] = useState(null);


  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleImageFileChange = (event) => {
    if (event.target.files.length > 0) {
      setImageUploaded(true);
      setImageFile(event.target.files[0]);
    } else {
      setImageUploaded(false);
      alert("No image file was uploaded!")
    }
  };

  const handleCancel = (event) => {
    event.preventDefault();
    cancelCreateMachine();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (imageFile) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageTypes.includes(imageFile.type)) {
        alert('Please upload a valid image file (jpg, png, gif, or webp).');
        return;
      }
      // if machineSize is null, then it is a CNC machine. Set machineSize to N/A
      let machineSizeInput = machineSize;
      if (machineSize === null) {
        machineSizeInput = "N/A";
      }
      createMachine(name, imageFile, machineType, machineSizeInput);
      setName('');
      setImageFile(null);
      setImageUploaded(false);
      setMachineType(null);
      setMachineSize(null);
    }
  };

  let machineSizeDropdownValues = <DropdownItem value="N/A" text={"Vælg Type først"} disabled={true} />;

  if (machineType === "STØB") {
    machineSizeDropdownValues = (
      <div>
        <Dropdown value={machineSize} onValueChange={setMachineSize}>
          <DropdownItem value="20" text={"20"} />
          <DropdownItem value="40" text={"40"} />
          <DropdownItem value="50" text={"50"} />
          <DropdownItem value="125" text={"125"} />
          <DropdownItem value="200" text={"200"} />
          <DropdownItem value="315" text={"315"} />
        </Dropdown>
      </div>
    );
  }
  else if (machineType === "CNC") {
    machineSizeDropdownValues = (
      <div>
        <DropdownItem value="N/A" text={"N/A"} />
      </div>
    );
  }


  return (
    <div className="machine-create">
      <form onSubmit={handleSubmit}>
        <div className="create-machine-input-container uploaded-container">
          <Card className='create-machine-form-outer-container' >
            <Flex className='create-machine-flex-container' justifyContent='center'>
              <div className='create-machine-form-inner-container'>
                <Text className='input-field-header'>Navn</Text>
                <TextInput
                  required
                  className='input-name input-equal-width'
                  type="text"
                  placeholder='Navn'
                  value={name}
                  onChange={handleNameChange}
                />
              </div>
              <div className='create-machine-form-inner-container'>
                <Text className='input-field-header'>Type</Text>
                <Dropdown className='input-equal-width' value={machineType} onValueChange={setMachineType}>
                  <DropdownItem value="STØB" text={"STØB"} />
                  <DropdownItem value="CNC" text={"CNC"} />
                </Dropdown>
              </div>
              <div className='create-machine-form-inner-container'>
                <Text className='input-field-header'>Størrelse</Text>
                <div className="input-equal-width">
                  {machineSizeDropdownValues}
                </div>
              </div>
              <div className='create-machine-form-inner-container'>
                <Text className='input-field-header'>Billede</Text>
                <MDBFile required accept="image/*" className='file-input' size='sm' onChange={handleImageFileChange} />
                {imageUploaded && <span className='checkmark'>&#10003;</span>}
              </div>
              <div className='create-machine-form-inner-container'>
                <div className="create-machine-button-container">
                  <Button className='accept-create-machine-button' type='submit'>Opret Maskine</Button>
                  <Button className='cancel-create-machine-button' type='button' variant="secondary" onClick={handleCancel}>Annuller</Button>
                </div>
              </div>
            </Flex>
          </Card>
        </div>
      </form>
    </div>
  );


}


export default MachineCreate;