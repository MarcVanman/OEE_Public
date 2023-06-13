import { MDBFile } from "mdb-react-ui-kit";
import React, { useState } from "react";
import "mdbreact/dist/css/mdb.css";
import useMachineContext from "../hooks/use-machine-context";
import { Button } from "@tremor/react";

function MachineEdit() {

  const { editMachineById, selectedMachine, showEdit, setShowEdit, uploadToS3, setImageFile } = useMachineContext();

  const [name, setName] = useState(selectedMachine.name);
  const [imageToDisplay, setImageToDisplay] = useState(selectedMachine.imageUrl);

  const uploadImageToS3 = async (imageFile) => {
    const imageKey = `${name}_${Date.now()}.${imageFile.name.split('.').pop()}`;
    const imageUrl = await uploadToS3(imageFile, imageKey);
    return imageUrl;
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleImageUrlChange = async (e) => {
    if (e.target.files.length > 0) {
      const uploadedImageUrl = await uploadImageToS3(e.target.files[0]);
      setImageToDisplay(uploadedImageUrl);
      setImageFile(e.target.files[0]);
    } else {
      alert("No image file was uploaded!")
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();


    editMachineById(selectedMachine.id, name, imageToDisplay);
    setShowEdit(false);
  };



  if (!showEdit) {
    return null;
  }

  return (
    <div className="Outer-edit-container">
      <div className="edit-form">
        <form onSubmit={handleSubmit} className="machine-edit">
          <label htmlFor="name">Name:</label>
          <input required className="input-edit-name" type="text" value={name} onChange={handleNameChange} />
          <label htmlFor="imageUrl">Image URL:</label>
          <MDBFile className="input-edit-imgurl" onChange={handleImageUrlChange} />
          <Button size="xl" type="submit">Update</Button>
        </form>
      </div>
      <div className="edit-image">
        <img
          alt=""
          src={imageToDisplay}
        />
      </div>
    </div>
  );

}

export default MachineEdit;