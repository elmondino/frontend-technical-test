import { request } from '../helpers';

describe('request() Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should call fetch with the provided URL', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    await request('/api/test.json');
    expect(global.fetch).toHaveBeenCalledWith('/api/test.json');
  });

  it('Should return parsed JSON on a successful response', async () => {
    const mockData = { id: 'xe', price: '£30,000' };
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) });
    const result = await request('/api/vehicle_xe.json');
    expect(result).toEqual(mockData);
  });

  it('Should throw an error when the response is not ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) });
    await expect(request('/api/missing.json')).rejects.toThrow('HTTP error: 404');
  });

  it('Should propagate network errors from fetch', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));
    await expect(request('/api/test.json')).rejects.toThrow('Network failure');
  });
});
