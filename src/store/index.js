import { configureStore } from '@reduxjs/toolkit';
import vehiclesReducer from './vehiclesSlice';

export default configureStore({
  reducer: {
    vehicles: vehiclesReducer,
  },
});
