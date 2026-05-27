import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import VehicleCard from '..';

// Prevent VehicleModal from needing a full DOM focus environment in unit tests
jest.mock('../../VehicleModal', () => function VehicleModal() {
  return <div data-testid="vehicle-modal" />;
});

const baseProps = {
  id: 'fpace',
  description: 'Breathtaking SUV with sports car soul.',
  price: '£45,000',
  media: [
    { name: 'vehicle', url: '/images/16x9/fpace_k17.jpg' },
    { name: 'vehicle', url: '/images/1x1/fpace_k17.jpg' },
  ],
  meta: {
    passengers: 5,
    drivetrain: ['AWD'],
    bodystyles: ['SUV'],
    emissions: { template: 'CO2 Emissions $value g/km', value: 149 },
  },
  index: 0,
};

// Helper avoids prop spreading (react/jsx-props-no-spreading)
const renderCard = (overrides = {}) => {
  const props = { ...baseProps, ...overrides };
  return render(
    <VehicleCard
      id={props.id}
      description={props.description}
      price={props.price}
      media={props.media}
      meta={props.meta}
      index={props.index}
    />,
  );
};

describe('<VehicleCard /> Tests', () => {
  it('formats vehicle name correctly from id', () => {
    const { getByRole } = renderCard();
    const heading = getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('F-PACE');
  });

  it('formats short vehicle id correctly', () => {
    const { getByRole } = renderCard({ id: 'xe' });
    const heading = getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('XE');
  });

  it('renders price with "From" prefix', () => {
    const { getByText } = renderCard();
    expect(getByText(/From\s+£45,000/)).not.toBeNull();
  });

  it('renders description text', () => {
    const { getByText } = renderCard();
    expect(getByText('Breathtaking SUV with sports car soul.')).not.toBeNull();
  });

  it('renders image with correct alt text matching formatted vehicle name', () => {
    const { getByAltText } = renderCard();
    expect(getByAltText('F-PACE')).not.toBeNull();
  });

  it('renders article element as the card root', () => {
    const { container } = renderCard();
    expect(container.querySelector('article.vehicle-card')).not.toBeNull();
  });

  it('Read more button starts with aria-expanded false', () => {
    const { getByText } = renderCard();
    const btn = getByText('Read more');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking Read more toggles aria-expanded to true', () => {
    const { getByText } = renderCard();
    const btn = getByText('Read more');
    fireEvent.click(btn);
    expect(btn.textContent).toBe('Read less');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking Read less toggles aria-expanded back to false', () => {
    const { getByText } = renderCard();
    fireEvent.click(getByText('Read more'));
    fireEvent.click(getByText('Read less'));
    expect(getByText('Read more').getAttribute('aria-expanded')).toBe('false');
  });

  it('extra content shows emissions text when expanded', () => {
    const { getByText, queryByText } = renderCard();
    expect(queryByText('CO2 Emissions 149 g/km')).toBeNull();
    fireEvent.click(getByText('Read more'));
    expect(queryByText('CO2 Emissions 149 g/km')).not.toBeNull();
  });

  it('clicking View details opens the modal', () => {
    const { getByText, queryByTestId } = renderCard();
    expect(queryByTestId('vehicle-modal')).toBeNull();
    fireEvent.click(getByText('View details'));
    expect(queryByTestId('vehicle-modal')).not.toBeNull();
  });
});
