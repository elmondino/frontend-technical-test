import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import VehicleList from './components/VehicleList';
import './global-styles.scss';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <VehicleList />
    </Provider>
  </React.StrictMode>,
  document.querySelector('.root')
);
