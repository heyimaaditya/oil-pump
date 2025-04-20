

CREATE TABLE IF NOT EXISTS EquipmentData (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Use TIMESTAMPTZ for time zone support
    suction_pressure FLOAT NOT NULL,
    discharge_pressure FLOAT NOT NULL,
    flow_rate FLOAT NOT NULL,
    fluid_temperature FLOAT NOT NULL,
    bearing_temperature FLOAT NOT NULL,
    vibration FLOAT NOT NULL,
    impeller_speed INT NOT NULL,
    lubrication_oil_level FLOAT NOT NULL,
    npsh FLOAT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_equipmentdata_timestamp ON EquipmentData (timestamp DESC);