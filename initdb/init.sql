
CREATE TABLE IF NOT EXISTS EquipmentData (
    id SERIAL PRIMARY KEY,                  
    timestamp TIMESTAMPTZ NOT NULL UNIQUE,  
    suction_pressure REAL,                  
    discharge_pressure REAL,
    flow_rate REAL,
    fluid_temperature REAL,
    bearing_temperature REAL,
    vibration REAL,
    impeller_speed INTEGER,               
    lubrication_oil_level REAL,
    npsh REAL,                              
    created_at TIMESTAMPTZ DEFAULT NOW()    
);


CREATE INDEX IF NOT EXISTS idx_equipmentdata_timestamp ON EquipmentData (timestamp DESC);



COMMENT ON COLUMN EquipmentData.timestamp IS 'Timestamp of the sensor reading (ISO 8601 format)';
COMMENT ON COLUMN EquipmentData.suction_pressure IS 'Pressure at the pump inlet (e.g., PSI, Bar)';
COMMENT ON COLUMN EquipmentData.discharge_pressure IS 'Pressure at the pump outlet (e.g., PSI, Bar)';
COMMENT ON COLUMN EquipmentData.flow_rate IS 'Volume of fluid passing through the pump (e.g., GPM, m³/h)';
COMMENT ON COLUMN EquipmentData.fluid_temperature IS 'Temperature of the fluid being pumped (e.g., °C, °F)';
COMMENT ON COLUMN EquipmentData.bearing_temperature IS 'Temperature of the pump bearings (e.g., °C, °F)';
COMMENT ON COLUMN EquipmentData.vibration IS 'Pump vibration level (e.g., mm/s RMS)';
COMMENT ON COLUMN EquipmentData.impeller_speed IS 'Rotational speed of the pump impeller (RPM)';
COMMENT ON COLUMN EquipmentData.lubrication_oil_level IS 'Level of lubrication oil (e.g., percentage 0-1)';
COMMENT ON COLUMN EquipmentData.npsh IS 'Net Positive Suction Head available (e.g., meters, feet)';

