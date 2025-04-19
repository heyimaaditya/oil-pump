import { EquipmentDataModel } from "../models/equipment-data.model";
export class DataGenerator{
    static generateData(): EquipmentDataModel {
        const randomFloat= (min: number, max: number,decimals: number=2):number=>{
            const str= (Math.random() * (max - min) + min).toFixed(decimals);
            return parseFloat(str);
        };
        const randomInt= (min: number, max: number):number=>{
            min= Math.ceil(min);
            max= Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min; 
        };
        return{
            timestamp: new Date().toISOString(),
            suction_pressure: randomFloat(5, 30),
            discharge_pressure: randomFloat(50, 150),
            flow_rate: randomFloat(50, 2000),
            fluid_temperature: randomFloat(20, 80),
            bearing_temperature: randomFloat(20, 100),
            vibration: randomFloat(0.1, 5),
            impeller_speed: randomInt(1000, 3600),
            lubrication_oil_level: randomFloat(10, 100),
            npsh: randomFloat(1, 15),
        };
    }
}