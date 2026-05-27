import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import VehicleModal from '..';

const baseVehicle = {
  id: 'fpace',
  description: 'A great SUV.',
  price: '£45,000',
  meta: {
    passengers: 5,
    drivetrain: ['AWD'],
    bodystyles: ['SUV'],
    emissions: { template: 'CO2 Emissions $value g/km', value: 149 },
  },
};

const renderModal = (vehicleOverrides = {}, onClose = jest.fn()) => {
  const vehicle = { ...baseVehicle, ...vehicleOverrides };
  return render(<VehicleModal vehicle={vehicle} onClose={onClose} />);
};

describe('<VehicleModal /> Tests', () => {
  it('renders with dialog role and aria attributes', () => {
    const { container } = renderModal();
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('vehicle-modal-title');
  });

  it('renders formatted vehicle name in the heading', () => {
    const { getByRole } = renderModal();
    const heading = getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('F-PACE');
  });

  it('renders emissions text', () => {
    const { getByText } = renderModal();
    expect(getByText('CO2 Emissions 149 g/km')).not.toBeNull();
  });

  it('renders bodystyle', () => {
    const { getByText } = renderModal();
    expect(getByText('SUV')).not.toBeNull();
  });

  it('renders drivetrain', () => {
    const { getByText } = renderModal();
    expect(getByText('AWD')).not.toBeNull();
  });

  it('renders passenger count', () => {
    const { getByText } = renderModal();
    expect(getByText('5')).not.toBeNull();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderModal({}, onClose);
    fireEvent.click(getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = renderModal({}, onClose);
    fireEvent.click(container.querySelector('.vehicle-modal__backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    renderModal({}, onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    const onClose = jest.fn();
    renderModal({}, onClose);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders gracefully when meta is empty', () => {
    const { container } = renderModal({ meta: {} });
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    expect(dl.children.length).toBe(0);
  });

  it('renders short vehicle ids correctly', () => {
    const { getByRole } = renderModal({ id: 'xe' });
    expect(getByRole('heading', { level: 2 }).textContent).toBe('XE');
  });
});
