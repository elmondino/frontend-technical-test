import React, { useState, useRef } from 'react';
import formatVehicleName from '../../utils/formatVehicleName';
import VehicleModal from '../VehicleModal';
import './style.scss';

/**
 * Displays a single vehicle card with image, name, price and description.
 * Includes accessible Read more toggle and View details modal trigger.
 *
 * @param {{ id: string, description: string, price: string, media: Array, meta: object, index: number }} props
 */
const VehicleCard = React.memo(({
  id,
  description,
  price,
  media,
  meta,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const detailsBtnRef = useRef(null);

  const image16x9 = media?.find((m) => m.url.includes('16x9'))?.url;
  const image1x1 = media?.find((m) => m.url.includes('1x1'))?.url || image16x9;
  const name = formatVehicleName(id);

  const handleCloseModal = () => {
    setModalOpen(false);
    detailsBtnRef.current?.focus();
  };

  return (
    <article className="vehicle-card" style={{ '--index': index }}>
      <picture className="vehicle-card__media">
        <source media="(min-width: 768px)" srcSet={image16x9} />
        <img src={image1x1} alt={name} className="vehicle-card__image" />
      </picture>

      <div className="vehicle-card__content">
        <h2 className="vehicle-card__name">{name}</h2>
        <p className="vehicle-card__price">
          From
          {' '}
          {price}
        </p>
        <p className="vehicle-card__description">{description}</p>

        <button
          type="button"
          className="vehicle-card__read-more"
          aria-expanded={expanded}
          aria-controls={`vehicle-extra-${id}`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>

        {expanded && (
          <div
            id={`vehicle-extra-${id}`}
            className="vehicle-card__extra"
          >
            {meta?.emissions && (
              <p className="vehicle-card__emission">
                {meta.emissions.template.replace('$value', meta.emissions.value)}
              </p>
            )}
            {meta?.bodystyles?.length > 0 && (
              <p className="vehicle-card__bodystyle">
                {meta.bodystyles.join(', ')}
              </p>
            )}
          </div>
        )}

        <button
          ref={detailsBtnRef}
          type="button"
          className="vehicle-card__details-btn"
          onClick={() => setModalOpen(true)}
        >
          View details
        </button>
      </div>

      {modalOpen && (
        <VehicleModal
          vehicle={{
            id, description, price, meta,
          }}
          onClose={handleCloseModal}
        />
      )}
    </article>
  );
});

VehicleCard.displayName = 'VehicleCard';

export default VehicleCard;
