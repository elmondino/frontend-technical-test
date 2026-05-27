import React, { useEffect, useRef } from 'react';
import formatVehicleName from '../../utils/formatVehicleName';
import './style.scss';

/**
 * Accessible modal dialog following WAI-ARIA 1.1 dialog pattern.
 * https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_modal
 *
 * @param {{ vehicle: object, onClose: function }} props
 */
export default function VehicleModal({ vehicle, onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const { id, meta } = vehicle;

  useEffect(() => {
    const dialog = dialogRef.current;

    // Move focus into modal on open
    closeBtnRef.current?.focus();

    // Close on Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap: cycle Tab / Shift+Tab within the dialog
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const emissionText = meta?.emissions
    ? meta.emissions.template.replace('$value', meta.emissions.value)
    : null;

  return (
    <div className="vehicle-modal__backdrop" aria-hidden="true" onClick={onClose}>
      {/* Stop click propagation so clicking inside dialog doesn't close it */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-modal-title"
        ref={dialogRef}
        className="vehicle-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="vehicle-modal__close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 id="vehicle-modal-title" className="vehicle-modal__title">
          {formatVehicleName(id)}
        </h2>

        <dl className="vehicle-modal__details">
          {emissionText && (
            <>
              <dt className="vehicle-modal__term">Emissions</dt>
              <dd className="vehicle-modal__description">{emissionText}</dd>
            </>
          )}
          {meta?.bodystyles?.length > 0 && (
            <>
              <dt className="vehicle-modal__term">Body Style</dt>
              <dd className="vehicle-modal__description">
                {meta.bodystyles.join(', ')}
              </dd>
            </>
          )}
          {meta?.drivetrain?.length > 0 && (
            <>
              <dt className="vehicle-modal__term">Drivetrain</dt>
              <dd className="vehicle-modal__description">
                {meta.drivetrain.join(', ')}
              </dd>
            </>
          )}
          {meta?.passengers && (
            <>
              <dt className="vehicle-modal__term">Passengers</dt>
              <dd className="vehicle-modal__description">{meta.passengers}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
