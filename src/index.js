import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import 'font-awesome/css/font-awesome.min.css';
import { MachineProvider } from './contexts/MachineContext';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

const el = document.getElementById('root');
const root = ReactDOM.createRoot(el);

root.render(
  <MachineProvider>
    <App />
  </MachineProvider>
);