import { PoolConfig } from "pg";
export const dbConfig: PoolConfig = {
    user:process.env.POSTGRES_USER|| 'postgres',
    host:process.env.POSTGRES_HOST || 'postgres',
    database:process.env.POSTGRES_DB || 'oil',
    password:process.env.POSTGRES_PASSWORD || 'postgres',
    port:parseInt(process.env.POSTGRES_PORT || '5432',10),
    max:20,
    idleTimeoutMillis:30000,
    connectionTimeoutMillis:2000,
}