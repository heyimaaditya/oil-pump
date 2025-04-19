import { Pool,QueryResult } from "pg";
import { dbConfig } from "../config/db.config";
import { EquipmentDataModel } from "../models/equipment-data.model";
import logger from "../logger";
interface PaginatedResponse<T>{
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export class DbService{
    private pool: Pool;
    constructor(){
        this.pool= new Pool(dbConfig);
        this.pool.on('error',(err,client)=>{
            logger.error({ err: err, clientInfo: client }, 'Unexpected error on idle PostgreSQL client');
            process.exit(-1);
        });
        logger.info('PostgreSQL Pool created.');
    }
    async connect(): Promise<void>{
        try{
            const client= await this.pool.connect();
            logger.info('Successfully connected to PostgreSQL.');
            client.release();
        }catch(err){
            logger.error({ err }, 'Failed to connect to PostgreSQL during startup check.');
            throw err;
        }
    }
    async checkConnection(): Promise<boolean> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1'); // Simple query to check connection
            client.release();
            return true;
        } catch (err) {
            logger.error({ err }, 'Database health check failed.');
            return false;
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
            logger.debug({ timestamp: data.timestamp }, 'Data inserted successfully');
        }catch(error){
            logger.error({ err: error, dataTimestamp: data.timestamp }, 'Error inserting data into PostgreSQL');
            throw error;
        }
    }
    private async executePaginatedQuery<T>(baseQuery: string, countQuery: string, page: number, limit: number): Promise<PaginatedResponse<T>> {
        const offset = (page - 1) * limit;
        const dataQuery = `${baseQuery} ORDER BY timestamp DESC LIMIT $1 OFFSET $2`;
        const dataParams = [limit, offset];
    
        try {
          // Run count and data query in parallel for efficiency
          const [countResult, dataResult] = await Promise.all([
              this.pool.query(countQuery),
              this.pool.query(dataQuery, dataParams)
          ]);
    
          const total = parseInt(countResult.rows[0]?.total || '0', 10);
    
          return {
              data: dataResult.rows,
              total: total,
              page: page,
              limit: limit
          };
        } catch (error) {
            logger.error({ err: error, query: baseQuery }, 'Error executing paginated query');
            throw error; // Let the controller handle the HTTP response
        }
      }
      async getPressureData(page: number, limit: number): Promise<PaginatedResponse<any>> {
        const baseQuery = `SELECT id, timestamp, suction_pressure, discharge_pressure, npsh FROM EquipmentData`;
        const countQuery = `SELECT COUNT(*) as total FROM EquipmentData`;
        return this.executePaginatedQuery(baseQuery, countQuery, page, limit);
      }
    
      async getMaterialData(page: number, limit: number): Promise<PaginatedResponse<any>> {
         const baseQuery = `SELECT id, timestamp, vibration, bearing_temperature, impeller_speed FROM EquipmentData`;
         const countQuery = `SELECT COUNT(*) as total FROM EquipmentData`;
         return this.executePaginatedQuery(baseQuery, countQuery, page, limit);
      }
    
      async getFluidData(page: number, limit: number): Promise<PaginatedResponse<any>> {
         const baseQuery = `SELECT id, timestamp, flow_rate, fluid_temperature, lubrication_oil_level FROM EquipmentData`;
         const countQuery = `SELECT COUNT(*) as total FROM EquipmentData`;
         return this.executePaginatedQuery(baseQuery, countQuery, page, limit);
      }
    
       async close(): Promise<void> {
          logger.info('Closing PostgreSQL Pool...');
          await this.pool.end();
          logger.info('PostgreSQL Pool closed.');
      }
    }
    
    export const dbService = new DbService();