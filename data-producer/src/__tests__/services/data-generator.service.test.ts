import { DataGenerator } from '../../services/data-generator.service';

describe('DataGenerator', () => {
  it('should generate data with correct structure and types', () => {
    const data = DataGenerator.generateData();

    expect(data).toBeDefined();
    expect(typeof data.timestamp).toBe('string');
    expect(Date.parse(data.timestamp)).not.toBeNaN(); 
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
  
    for (let i = 0; i < 10; i++) {
      const data = DataGenerator.generateData();
      expect(data.suction_pressure).toBeGreaterThanOrEqual(5);
      expect(data.suction_pressure).toBeLessThanOrEqual(30);
      expect(data.discharge_pressure).toBeGreaterThan(data.suction_pressure);
      expect(data.impeller_speed).toBeGreaterThanOrEqual(1000);
      expect(data.impeller_speed).toBeLessThanOrEqual(3600);
      expect(data.lubrication_oil_level).toBeGreaterThanOrEqual(0.6);
      expect(data.lubrication_oil_level).toBeLessThanOrEqual(1.0);
    
    }
  });
});
