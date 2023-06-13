import React, { useEffect, useContext, useRef } from 'react';
import './App.css';
import { PrimaryModalProvider } from './contexts/PrimaryModalContext';
import { Button } from "@tremor/react"; import MachineContext from './contexts/MachineContext';
import MachineList from './components/MachineList';
import MachineCreate from './components/MachineCreate';
import MachinePrimaryModal from './modals/MachinePrimaryModal';
import { useScrollIntoView } from './reusable_functions/useScrollIntoView';
import { useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './sidebar';
import Dashboard from './components/Dashboard';
import { Authenticator, useTheme, View, Image } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';


function App() {

  const {
    getAllItems,
    showCreate,
    setShowCreate,
    showAddMachine,
    setShowAddMachine,
    setMachines,
  } = useContext(MachineContext);


  useEffect(() => {
    const fetchData = async () => {
      const responseData = await getAllItems({
        all: true,
        table: 'OEE-Machines'
      });
      console.log('fetching machines', responseData);
      setMachines(responseData);
    };
    fetchData();
  }, [getAllItems, setMachines]);



  const handleCreateClick = (ref) => {
    setShowCreate(!showCreate);
    setShowAddMachine(!showAddMachine);
    if (ref) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const refCreateMachineForm = useRef(null);

  useScrollIntoView(refCreateMachineForm, showCreate);


  const DevAuthLogout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
      try {
        await Auth.signOut();
        navigate('/');
      } catch (error) {
        console.error('Error signing out: ', error);
      }
    };

    return (
      <button onClick={handleLogout}>Force Logout</button>
    );
  };

  const components = {
    Header() {
      const { tokens } = useTheme();

      return (
        <View textAlign="center" padding={tokens.space.large}>
          <Image
            alt="Linimatic logo"
            src="https://linimatic.eu/wp-content/uploads/2020/09/linimatic-logo-desktop.png"
          />
        </View>
      );
    }
  };

  //        <DevAuthLogout />

  return (
    <Authenticator
      components={components}
      hideSignUp={true}
    >
      <Router>
        <div className="App">
          <Sidebar />
          <div className="main-container">
            <Routes>
              <Route path="/" element={
                <>
                  <MachineList />
                  <div className='add_machine_button_container'>
                    {showAddMachine && <Button className='add-machine-button' size="xl" onClick={() => handleCreateClick(refCreateMachineForm)}>Tilføj Maskine</Button>}
                  </div>
                  <div ref={refCreateMachineForm}>
                    {showCreate && <MachineCreate />}
                  </div>
                  <div>
                    <PrimaryModalProvider>
                      <MachinePrimaryModal />
                    </PrimaryModalProvider>
                  </div>
                </>
              } />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </Router>
    </Authenticator >
  );
}
export default App;