export interface EquipmentData {
    id: number; timestamp: string; suction_pressure: number; discharge_pressure: number; flow_rate: number;
    fluid_temperature: number; bearing_temperature: number; vibration: number; impeller_speed: number;
    lubrication_oil_level: number; npsh: number;
  }
  export interface PressureData { id: number; timestamp: string; suction_pressure: number; discharge_pressure: number; npsh: number; }
  export interface MaterialData { id: number; timestamp: string; vibration: number; bearing_temperature: number; impeller_speed: number; }
  export interface FluidData { id: number; timestamp: string; flow_rate: number; fluid_temperature: number; lubrication_oil_level: number; }
  export interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }