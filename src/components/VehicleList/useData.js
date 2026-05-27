import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVehicles } from '../../store/vehiclesSlice';

export default function useData() {
  const dispatch = useDispatch();
  const { loading, error, data: vehicles } = useSelector((state) => state.vehicles);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  return [loading, error, vehicles];
}
