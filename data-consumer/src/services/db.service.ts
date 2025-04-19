import { Pool,QueryResult } from "pg";
import { dbConfig } from "../config/db.config";
import { EquipmentDataModel } from "../models/equipment-data.model";
export class DbService{
    private pool: Pool;
    constructor(){
        this.pool= new Pool(dbConfig);
        this.pool.on('error',(err,client)=>{
            console.error('Unexpected error on idle client',err);
            process.exit(-1);
        });
        console.log("Database connection pool created.");
    }
    async connect(): Promise<void>{
        try{
            const client= await this.pool.connect();
            console.log("Connected to database.");
            client.release();
        }catch(error){
            console.error("Error connecting to database:",error);
            throw error;
        }
    }
    async insertData(data: EquipmentDataModel): Promise<void>{
        const query= `INSERT INTO equipment_data(timestamp,suction_pressure,discharge_pressure,flow_rate,fluid_temperature,bearing_temperature,vibration,impeller_speed,lubrication_oil_level,npsh) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
        const values= [
            data.timestamp,
            data.suction_pressure,
            data.discharge_pressure,
            data.flow_rate,
            data.fluid_temperature,
            data.bearing_temperature,
            data.vibration,
            data.impeller_speed,
            data.lubrication_oil_level,
            data.npsh
        ];
        try{
            await this.pool.query(query,values);
        }catch(error){
            console.error("Error inserting data into database:",error);
        }
    }
    async getPressureData(): Promise<any[]>{
        const query= `SELECT timestamp,suction_pressure,discharge_pressure FROM equipment_data ORDER BY timestamp DESC LIMIT 10`;
        try{
            const result: QueryResult= await this.pool.query(query);
            return result.rows;
        }catch(error){
            console.error("Error fetching pressure data:",error);
            throw error;
        }
    }
    async getMaterialData(): Promise<any[]> {
        const query = `
          SELECT id, timestamp, vibration, bearing_temperature, impeller_speed
          FROM EquipmentData
          ORDER BY timestamp DESC LIMIT 100
        `;
        try {
          const result: QueryResult = await this.pool.query(query);
          return result.rows;
        } catch (error) {
          console.error('Error fetching material data:', error);
          throw error;
        }
     }
   
     async getFluidData(): Promise<any[]> {
        const query = `
          SELECT id, timestamp, flow_rate, fluid_temperature, lubrication_oil_level
          FROM EquipmentData
          ORDER BY timestamp DESC LIMIT 100
        `;
        try {
          const result: QueryResult = await this.pool.query(query);
          return result.rows;
        } catch (error) {
          console.error('Error fetching fluid data:', error);
          throw error;
        }
     }
     async close(): Promise<void> {
        await this.pool.end();
        console.log('PostgreSQL Pool closed.');
    }

    
}
export const dbService = new DbService();