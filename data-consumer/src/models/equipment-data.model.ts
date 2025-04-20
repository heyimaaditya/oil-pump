export interface EquipmentDataModel {
  timestamp: string;
  suction_pressure: number;
  discharge_pressure: number;
  flow_rate: number;
  fluid_temperature: number;
  bearing_temperature: number;
  vibration: number;
  impeller_speed: number;
  lubrication_oil_level: number;
  npsh: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
  