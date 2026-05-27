import React from 'react';
import useData from './useData';
import VehicleCard from '../VehicleCard';
import './style.scss';

const SKELETON_COUNT = 4;

export default function VehicleList() {
  const [loading, error, vehicles] = useData();

  if (loading) {
    return (
      <main className="vehicle-list">
        <div data-testid="loading" className="vehicle-list__loading" aria-busy="true" aria-label="Loading vehicles">
          <ul className="vehicle-list__grid vehicle-list__grid--skeleton" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i} className="vehicle-list__item">
                <div className="vehicle-list__skeleton" />
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="vehicle-list">
        <div data-testid="error" className="vehicle-list__error">{error}</div>
      </main>
    );
  }

  return (
    <main className="vehicle-list">
      <h1 className="vehicle-list__title">Our Vehicles</h1>
      <ul className="vehicle-list__grid" data-testid="results">
        {Array.isArray(vehicles) && vehicles.map((vehicle, index) => (
          <li key={vehicle.id} className="vehicle-list__item">
            <VehicleCard
              id={vehicle.id}
              description={vehicle.description}
              price={vehicle.price}
              media={vehicle.media}
              meta={vehicle.meta}
              index={index}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
