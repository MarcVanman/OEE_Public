import {useState, createContext } from 'react';

const PrimaryModalContext = createContext();

function PrimaryModalProvider ({ children }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPOrderModalOpen, setEditPOrderModalOpen] = useState(false);
  const [deletePOrderModalOpen, setDeletePOrderModalOpen] = useState(false);
  const [editDailyModalOpen, setEditDailyModalOpen] = useState(false);

  const values_to_share = {
    editModalOpen,
    setEditModalOpen,
    editPOrderModalOpen,
    setEditPOrderModalOpen,
    deletePOrderModalOpen,
    setDeletePOrderModalOpen,
    editDailyModalOpen,
    setEditDailyModalOpen,
  };


    return (
        <PrimaryModalContext.Provider
          value={values_to_share}
        >
          {children}
        </PrimaryModalContext.Provider>
      )

};
export { PrimaryModalProvider };
export default PrimaryModalContext;
