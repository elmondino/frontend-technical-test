import { request } from './helpers';

/**
 * Pull vehicles information
 *
 * @return {Promise<Array.<vehicleSummaryPayload>>}
 */
export default async function getData() {
  const vehicles = await request('/api/vehicles.json');

  // Guard: filter out entries where apiUrl is missing or falsy (broken)
  const validVehicles = vehicles.filter((v) => v.apiUrl);

  const results = await Promise.allSettled(
    validVehicles.map((v) => request(v.apiUrl)),
  );

  return results
    .map((result, i) => ({ result, base: validVehicles[i] }))
    .filter(({ result }) => result.status === 'fulfilled')
    .map(({ result, base }) => ({ ...base, ...result.value }))
    .filter(({ price }) => price && price.trim() !== '');
}
