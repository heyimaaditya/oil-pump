import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { EquipmentDataModel, PaginatedResponse } from '../models/equipment-data.model';
import logger from '../logger';

export class DbService {
   private pool: Pool;
   private connecting: Promise<void> | null = null;

   constructor() {
     this.pool = new Pool(config.db);
     this.pool.on('error', (err, client) => logger.error({ err: err, clientInfo: (client as any)?.processID }, 'Unexpected error on idle PostgreSQL client'));
     this.pool.on('connect', (client) => logger.debug({ processId: (client as any).processID }, 'New PostgreSQL client connected'));
     this.pool.on('remove', (client) => logger.debug({ processId: (client as any).processID }, 'PostgreSQL client removed from pool'));
     logger.info('PostgreSQL Pool created.');
   }

   async ensureConnected(): Promise<void> {
        if (!this.connecting) { this.connecting = this.connect(); }
        return this.connecting;
   }

   private async connect(): Promise<void> {
     let client: PoolClient | null = null;
     try {
         logger.info('Attempting initial connection to PostgreSQL...');
         client = await this.pool.connect();
         const res = await client.query('SELECT NOW()');
         logger.info({ dbTime: res.rows[0].now },'Successfully connected to PostgreSQL.');
     } catch (err) {
         logger.error({ err }, 'Failed to connect to PostgreSQL during initial check.');
         throw err;
     } finally { client?.release(); }
   }

   async checkConnection(): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await this.pool.connect();
            await client.query('SELECT 1');
            return true;
        } catch (err) {
            logger.error({ err }, 'Database health check failed.');
            return false;
        } finally { client?.release(); }
   }

  async insertData(data: EquipmentDataModel): Promise<void> {
    const query = `
      INSERT INTO EquipmentData ( timestamp, suction_pressure, discharge_pressure, flow_rate, fluid_temperature, bearing_temperature, vibration, impeller_speed, lubrication_oil_level, npsh )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (timestamp) DO NOTHING;`; 
     const values = [ data.timestamp, data.suction_pressure, data.discharge_pressure, data.flow_rate, data.fluid_temperature, data.bearing_temperature, data.vibration, data.impeller_speed, data.lubrication_oil_level, data.npsh ];

    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const result = await client.query(query, values);
      if ((result.rowCount || 0) > 0) { logger.debug({ timestamp: data.timestamp }, 'Data inserted successfully'); }

    } catch (error) {
      logger.error({ err: error, dataTimestamp: data.timestamp }, 'Error inserting data into PostgreSQL');
      throw error;
    } finally { client?.release(); }
  }

  private async executePaginatedQuery<T>(baseQuery: string, countQuery: string, page: number, limit: number, queryParams: any[] = []): Promise<PaginatedResponse<T>> {
    const offset = (page - 1) * limit;
    const dataQuery = `${baseQuery} ORDER BY timestamp DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const dataParams = [...queryParams, limit, offset];

    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      const [countResult, dataResult] = await Promise.all([
          client.query(countQuery, queryParams),
          client.query(dataQuery, dataParams)
      ]);
      const total = parseInt(countResult.rows[0]?.total || '0', 10);
      const totalPages = Math.ceil(total / limit);
      return { data: dataResult.rows, total: total, page: page, limit: limit, totalPages: totalPages };
    } catch (error) {
        logger.error({ err: error, baseQuery: baseQuery }, 'Error executing paginated query');
        throw error;
    } finally { client?.release(); }
  }

  async getPressureData(page: number, limit: number): Promise<PaginatedResponse<{id: number, timestamp: string, suction_pressure: number, discharge_pressure: number, npsh: number}>> {
    const baseQuery = `SELECT id, timestamp, suction_pressure, discharge_pressure, npsh FROM EquipmentData`;
    const countQuery = `SELECT COUNT(*) as total FROM EquipmentData`;
    return this.executePaginatedQuery(baseQuery, countQuery, page, limit);
  }

  async getMaterialData(page: number, limit: number): Promise<PaginatedResponse<{id: number, timestamp: string, vibration: number, bearing_temperature: number, impeller_speed: number}>> {
     const baseQuery = `SELECT id, timestamp, vibration, bearing_temperature, impeller_speed FROM EquipmentData`;
     const countQuery = `SELECT COUNT(*) as total FROM EquipmentData`;
     return this.executePaginatedQuery(baseQuery, countQuery, page, limit);
  }

  async getFluidData(page: number, limit: number): Promise<PaginatedResponse<{id: number, timestamp: string, flow_rate: number, fluid_temperature: number, lubrication_oil_level: number}>> {
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
