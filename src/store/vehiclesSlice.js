import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import getData from '../api';

export const fetchVehicles = createAsyncThunk('vehicles/fetch', () => getData());

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState: { loading: false, error: null, data: [] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => ({
        ...state,
        loading: true,
        error: null,
      }))
      .addCase(fetchVehicles.fulfilled, (state, action) => ({
        ...state,
        loading: false,
        data: action.payload,
      }))
      .addCase(fetchVehicles.rejected, (state, action) => ({
        ...state,
        loading: false,
        error: action.error.message || 'Failed to load vehicles',
      }));
  },
});

export default vehiclesSlice.reducer;
