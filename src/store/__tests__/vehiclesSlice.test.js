import reducer, { fetchVehicles } from '../vehiclesSlice';

const initialState = { loading: false, error: null, data: [] };

describe('vehiclesSlice reducer', () => {
  it('returns the initial state when called with undefined', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets loading true and clears error on pending', () => {
    const state = reducer(initialState, fetchVehicles.pending('id', undefined));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('does not overwrite existing data while pending', () => {
    const withData = { ...initialState, data: [{ id: 'xe' }] };
    const state = reducer(withData, fetchVehicles.pending('id', undefined));
    expect(state.data).toEqual([{ id: 'xe' }]);
  });

  it('sets loading false and stores data on fulfilled', () => {
    const vehicles = [{ id: 'xe', price: '£30,000' }];
    const state = reducer(
      { ...initialState, loading: true },
      fetchVehicles.fulfilled(vehicles, 'id', undefined),
    );
    expect(state.loading).toBe(false);
    expect(state.data).toEqual(vehicles);
    expect(state.error).toBeNull();
  });

  it('sets loading false and stores error message on rejected', () => {
    const error = new Error('Network error');
    const state = reducer(
      { ...initialState, loading: true },
      fetchVehicles.rejected(error, 'id', undefined),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
    expect(state.data).toEqual([]);
  });

  it('falls back to default message when rejected error has no message', () => {
    // new Error() has message === '' which is falsy, triggering the fallback
    const state = reducer(
      { ...initialState, loading: true },
      fetchVehicles.rejected(new Error(), 'id', undefined),
    );
    expect(state.error).toBe('Failed to load vehicles');
  });
});
