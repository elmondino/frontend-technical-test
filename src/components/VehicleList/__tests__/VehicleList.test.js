import React from 'react';
import { render } from '@testing-library/react';
import VehicleList from '..';
import useData from '../useData';

jest.mock('../useData');
jest.mock('../../VehicleCard', () => function VehicleCard({ id }) { return <div data-testid={`card-${id}`} />; });

describe('<VehicleList /> Tests', () => {
  it('Should show loading state if it not falsy', () => {
    useData.mockReturnValue([true, 'An error occurred', 'results']);
    const { queryByTestId } = render(<VehicleList />);

    expect(queryByTestId('loading')).not.toBeNull();
    expect(queryByTestId('error')).toBeNull();
    expect(queryByTestId('results')).toBeNull();
  });

  it('Should show error if it is not falsy and loading is finished', () => {
    useData.mockReturnValue([false, 'An error occurred', 'results']);
    const { queryByTestId } = render(<VehicleList />);

    expect(queryByTestId('loading')).toBeNull();
    expect(queryByTestId('error')).not.toBeNull();
    expect(queryByTestId('results')).toBeNull();
  });

  it('Should show results if loading successfully finished', () => {
    useData.mockReturnValue([false, false, 'results']);
    const { queryByTestId } = render(<VehicleList />);

    expect(queryByTestId('loading')).toBeNull();
    expect(queryByTestId('error')).toBeNull();
    expect(queryByTestId('results')).not.toBeNull();
  });

  it('Should render an empty list when vehicles array is empty', () => {
    useData.mockReturnValue([false, false, []]);
    const { queryByTestId } = render(<VehicleList />);
    const results = queryByTestId('results');

    expect(results).not.toBeNull();
    expect(results.querySelectorAll('li').length).toBe(0);
  });

  it('Should render a card for each vehicle in the list', () => {
    const vehicles = [
      { id: 'xe', description: 'Test description', price: '£30,000', media: [], meta: {} },
      { id: 'xj', description: 'Test description', price: '£76,350', media: [], meta: {} },
    ];
    useData.mockReturnValue([false, false, vehicles]);
    const { queryByTestId } = render(<VehicleList />);

    expect(queryByTestId('card-xe')).not.toBeNull();
    expect(queryByTestId('card-xj')).not.toBeNull();
  });
});
