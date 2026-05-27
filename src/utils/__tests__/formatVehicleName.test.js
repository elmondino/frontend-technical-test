import formatVehicleName from '../formatVehicleName';

describe('formatVehicleName', () => {
  it('returns empty string for falsy input', () => {
    expect(formatVehicleName('')).toBe('');
    expect(formatVehicleName(null)).toBe('');
    expect(formatVehicleName(undefined)).toBe('');
  });

  it('uppercases 1-character ids', () => {
    expect(formatVehicleName('x')).toBe('X');
  });

  it('uppercases 2-character ids without a hyphen', () => {
    expect(formatVehicleName('xe')).toBe('XE');
    expect(formatVehicleName('xj')).toBe('XJ');
    expect(formatVehicleName('xf')).toBe('XF');
  });

  it('formats ids longer than 2 chars as FIRST-REST', () => {
    expect(formatVehicleName('fpace')).toBe('F-PACE');
    expect(formatVehicleName('ftype')).toBe('F-TYPE');
    expect(formatVehicleName('ipace')).toBe('I-PACE');
  });

  it('handles already-uppercase input', () => {
    expect(formatVehicleName('XE')).toBe('XE');
    expect(formatVehicleName('FPACE')).toBe('F-PACE');
  });
});
