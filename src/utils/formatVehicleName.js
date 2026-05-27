/**
 * Formats a raw vehicle id into a display name.
 * Short ids (1-2 chars) are uppercased: xe -> XE
 * Longer ids split at first char with a hyphen: fpace -> F-PACE
 *
 * @param {string} id
 * @return {string}
 */
export default function formatVehicleName(id) {
  if (!id) return '';
  if (id.length <= 2) return id.toUpperCase();
  return `${id[0].toUpperCase()}-${id.slice(1).toUpperCase()}`;
}
