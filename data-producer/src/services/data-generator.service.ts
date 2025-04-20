import { EquipmentDataModel } from '../models/equipment-data.model';

export class DataGenerator {
  private static getRandomFloat(min: number, max: number, decimals: number = 2): number {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
  }

  private static getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static generateData(): EquipmentDataModel {
    const suction_pressure = this.getRandomFloat(5, 30);
    const discharge_pressure = suction_pressure * this.getRandomFloat(3, 6);
    const flow_rate = this.getRandomFloat(50, 500);
    const npsh_available = this.getRandomFloat(3, 15);

    return {
      timestamp: new Date().toISOString(),
      suction_pressure: suction_pressure,
      discharge_pressure: discharge_pressure,
      flow_rate: flow_rate,
      fluid_temperature: this.getRandomFloat(20, 90),
      bearing_temperature: this.getRandomFloat(40, 110),
      vibration: this.getRandomFloat(0.5, 15),
      impeller_speed: this.getRandomInt(1000, 3600),
      lubrication_oil_level: this.getRandomFloat(0.6, 1.0),
      npsh: npsh_available,
    };
  }
}
