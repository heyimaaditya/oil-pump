import { DataGenerator } from '../../services/data-generator.service';

describe('DataGenerator', () => {
  it('should generate data with correct structure and types', () => {
    const data = DataGenerator.generateData();

    expect(data).toBeDefined();
    expect(typeof data.timestamp).toBe('string');
    expect(new Date(data.timestamp)).toBeInstanceOf(Date); // Check if parsable date
    expect(typeof data.suction_pressure).toBe('number');
    expect(typeof data.discharge_pressure).toBe('number');
    expect(typeof data.flow_rate).toBe('number');
    expect(typeof data.fluid_temperature).toBe('number');
    expect(typeof data.bearing_temperature).toBe('number');
    expect(typeof data.vibration).toBe('number');
    expect(typeof data.impeller_speed).toBe('number');
    expect(Number.isInteger(data.impeller_speed)).toBe(true);
    expect(typeof data.lubrication_oil_level).toBe('number');
    expect(typeof data.npsh).toBe('number');
  });

  it('should generate values within expected ranges (basic check)', () => {
    // Run a few times to increase confidence
    for (let i = 0; i < 5; i++) {
      const data = DataGenerator.generateData();
      expect(data.suction_pressure).toBeGreaterThanOrEqual(5);
      expect(data.suction_pressure).toBeLessThanOrEqual(30);
      expect(data.impeller_speed).toBeGreaterThanOrEqual(1000);
      expect(data.impeller_speed).toBeLessThanOrEqual(3600);
      // Add more range checks as needed
    }
  });
});