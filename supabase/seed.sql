-- =============================================================================
-- MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — SEED DATA
-- Version: 1.0.0
-- Dialect: PostgreSQL 15+ / Supabase
-- =============================================================================

-- Clear existing data (in dependency order)
DELETE FROM audit_logs;
DELETE FROM corrective_actions;
DELETE FROM shortfall_predictions;
DELETE FROM weather_telemetry;
DELETE FROM historical_yields;
DELETE FROM mining_equipment;
DELETE FROM mines;

-- -----------------------------------------------------------------------------
-- 1. SEED MINES (8 Primary MOIL Manganese Mining Units)
-- -----------------------------------------------------------------------------
INSERT INTO mines (id, code, name, state, district, latitude, longitude, mine_type, annual_capacity_mt, established_year, is_active)
VALUES
('b01a0001-0000-0000-0000-000000000001', 'MOIL-BAL', 'Balaghat Mine', 'Madhya Pradesh', 'Balaghat', 21.808300, 80.183300, 'UNDERGROUND', 450000.00, 1903, true),
('b01a0001-0000-0000-0000-000000000002', 'MOIL-DON', 'Dongri Buzurg Mine', 'Maharashtra', 'Bhandara', 21.558300, 79.683300, 'OPENCAST', 380000.00, 1921, true),
('b01a0001-0000-0000-0000-000000000003', 'MOIL-MAN', 'Mansar Mine', 'Maharashtra', 'Nagpur', 21.391700, 79.283300, 'MIXED', 220000.00, 1901, true),
('b01a0001-0000-0000-0000-000000000004', 'MOIL-CHK', 'Chikla Mine', 'Maharashtra', 'Bhandara', 21.550000, 79.750000, 'UNDERGROUND', 180000.00, 1912, true),
('b01a0001-0000-0000-0000-000000000005', 'MOIL-KAN', 'Kandri Mine', 'Maharashtra', 'Nagpur', 21.416700, 79.266700, 'MIXED', 160000.00, 1900, true),
('b01a0001-0000-0000-0000-000000000006', 'MOIL-GUM', 'Gumgaon Mine', 'Maharashtra', 'Nagpur', 21.383300, 79.033300, 'UNDERGROUND', 140000.00, 1908, true),
('b01a0001-0000-0000-0000-000000000007', 'MOIL-TIR', 'Tirodi Mine', 'Madhya Pradesh', 'Balaghat', 21.683300, 79.716700, 'OPENCAST', 190000.00, 1928, true),
('b01a0001-0000-0000-0000-000000000008', 'MOIL-UKW', 'Ukwa Mine', 'Madhya Pradesh', 'Balaghat', 21.966700, 80.466700, 'UNDERGROUND', 120000.00, 1906, true);

-- -----------------------------------------------------------------------------
-- 2. SEED MINING EQUIPMENT (Across all 8 mines)
-- -----------------------------------------------------------------------------
INSERT INTO mining_equipment (mine_id, equipment_code, name, equipment_type, model, status, health_score, operating_hours, vibration_level_mm_s, temp_celsius, fuel_efficiency_pct, last_serviced_date)
VALUES
-- Balaghat (Underground)
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-HOIST-01', 'Main Vertical Shaft Hoist #1', 'HOIST_WINCH', 'BHEL 1200kW Ward-Leonard', 'OPERATIONAL', 94.50, 14200.0, 1.45, 62.0, 95.0, '2026-07-15'),
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-PUMP-01', 'Sub-level Dewatering Pump Alpha', 'DEWATERING_PUMP', 'Kirloskar 500HP High-Head', 'OPERATIONAL', 88.00, 8900.0, 2.10, 71.0, 91.0, '2026-07-28'),
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-DRILL-01', 'Jumbo Electro-Hydraulic Drill', 'DRILL_RIG', 'Sandvik DD321', 'MAINTENANCE_REQUIRED', 64.00, 11400.0, 4.80, 86.5, 78.0, '2026-06-10'),
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-CONV-01', 'Main Ore Haulage Conveyor A', 'CONVEYOR', 'Fenner Heavy Duty 1200mm', 'OPERATIONAL', 91.00, 7200.0, 1.60, 58.0, 96.0, '2026-08-01'),

-- Dongri Buzurg (Opencast)
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-EXC-01', 'Hydraulic Pit Excavator #1', 'EXCAVATOR', 'Komatsu PC1250-8', 'OPERATIONAL', 91.00, 6500.0, 1.80, 74.0, 89.0, '2026-07-20'),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-TRK-01', 'Heavy Off-Highway Dumper 01', 'HAUL_TRUCK', 'Caterpillar 773E (55 Ton)', 'OPERATIONAL', 82.50, 9300.0, 2.40, 78.0, 84.0, '2026-07-18'),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-TRK-02', 'Heavy Off-Highway Dumper 02', 'HAUL_TRUCK', 'Caterpillar 773E (55 Ton)', 'OPERATIONAL', 79.00, 9800.0, 2.70, 80.5, 82.0, '2026-07-12'),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-PUMP-01', 'Pit Sump Main Dewatering Pump', 'DEWATERING_PUMP', 'Sulzer 400HP Submersible', 'CRITICAL_FAILURE', 38.00, 13400.0, 6.90, 94.0, 65.0, '2026-05-30'),

-- Mansar (Mixed)
('b01a0001-0000-0000-0000-000000000003', 'EQ-MAN-EXC-01', 'Opencast Bench Excavator #1', 'EXCAVATOR', 'Hitachi EX1200-6', 'OPERATIONAL', 87.50, 8100.0, 2.10, 72.0, 90.0, '2026-07-22'),
('b01a0001-0000-0000-0000-000000000003', 'EQ-MAN-HOIST-01', 'Underground Winch Hoist', 'HOIST_WINCH', 'Alimak Hek 600kW', 'OPERATIONAL', 93.00, 5200.0, 1.30, 60.0, 94.0, '2026-08-05'),
('b01a0001-0000-0000-0000-000000000003', 'EQ-MAN-PUMP-01', 'Central Drainage Pump #1', 'DEWATERING_PUMP', 'Kirloskar 350HP', 'OPERATIONAL', 85.00, 7400.0, 2.30, 68.0, 88.0, '2026-07-10'),

-- Chikla (Underground)
('b01a0001-0000-0000-0000-000000000004', 'EQ-CHK-HOIST-01', 'Chikla Shaft Hoisting System', 'HOIST_WINCH', 'BHEL 800kW Electric', 'OPERATIONAL', 90.00, 10800.0, 1.70, 64.0, 92.0, '2026-07-02'),
('b01a0001-0000-0000-0000-000000000004', 'EQ-CHK-PUMP-01', 'Deep Sump Dewatering Unit', 'DEWATERING_PUMP', 'Wilo 300HP High-Pressure', 'OPERATIONAL', 86.50, 6200.0, 1.90, 67.0, 90.0, '2026-08-02'),
('b01a0001-0000-0000-0000-000000000004', 'EQ-CHK-DRILL-01', 'Underground Face Drill', 'DRILL_RIG', 'Atlas Copco Boomer 282', 'STANDBY', 89.00, 4500.0, 1.50, 55.0, 93.0, '2026-07-25'),

-- Kandri (Mixed)
('b01a0001-0000-0000-0000-000000000005', 'EQ-KAN-EXC-01', 'Pit Face Loader Excavator', 'EXCAVATOR', 'Volvo EC750D', 'OPERATIONAL', 84.00, 7600.0, 2.20, 75.0, 87.0, '2026-07-19'),
('b01a0001-0000-0000-0000-000000000005', 'EQ-KAN-TRK-01', 'Mining Dump Truck K1', 'HAUL_TRUCK', 'BEML BH60M', 'OPERATIONAL', 81.00, 8900.0, 2.50, 79.0, 83.0, '2026-07-14'),
('b01a0001-0000-0000-0000-000000000005', 'EQ-KAN-PUMP-01', 'Auxiliary Pit Dewatering Pump', 'DEWATERING_PUMP', 'Flowserve 250HP', 'MAINTENANCE_REQUIRED', 58.00, 12800.0, 5.10, 89.0, 74.0, '2026-06-28'),

-- Gumgaon (Underground)
('b01a0001-0000-0000-0000-000000000006', 'EQ-GUM-HOIST-01', 'Vertical Incline Hoist', 'HOIST_WINCH', 'BHEL 600kW Winch', 'OPERATIONAL', 92.00, 9100.0, 1.50, 61.0, 93.0, '2026-07-30'),
('b01a0001-0000-0000-0000-000000000006', 'EQ-GUM-PUMP-01', 'Underground Sump Pump G1', 'DEWATERING_PUMP', 'Kirloskar 250HP', 'OPERATIONAL', 83.00, 8400.0, 2.40, 70.0, 88.0, '2026-07-21'),

-- Tirodi (Opencast)
('b01a0001-0000-0000-0000-000000000007', 'EQ-TIR-EXC-01', 'Overburden Excavator T1', 'EXCAVATOR', 'Komatsu PC800-8', 'OPERATIONAL', 88.00, 6900.0, 2.00, 73.0, 89.0, '2026-08-03'),
('b01a0001-0000-0000-0000-000000000007', 'EQ-TIR-TRK-01', 'Off-Highway Dumper T01', 'HAUL_TRUCK', 'Caterpillar 773E', 'OPERATIONAL', 85.50, 8200.0, 2.30, 76.0, 86.0, '2026-07-27'),
('b01a0001-0000-0000-0000-000000000007', 'EQ-TIR-PUMP-01', 'Bench Drainage Pump T1', 'DEWATERING_PUMP', 'Sulzer 200HP', 'OPERATIONAL', 89.00, 5600.0, 1.80, 66.0, 91.0, '2026-08-01'),

-- Ukwa (Underground)
('b01a0001-0000-0000-0000-000000000008', 'EQ-UKW-HOIST-01', 'Ukwa Main Incline Haulage', 'HOIST_WINCH', 'Siemens 500kW Electric', 'OPERATIONAL', 95.0, 4800.0, 1.20, 59.0, 96.0, '2026-08-04'),
('b01a0001-0000-0000-0000-000000000008', 'EQ-UKW-PUMP-01', 'Mine Discharge Pump U1', 'DEWATERING_PUMP', 'Kirloskar 200HP', 'OPERATIONAL', 87.00, 7100.0, 2.10, 68.0, 89.0, '2026-07-29');

-- -----------------------------------------------------------------------------
-- 3. SEED HISTORICAL YIELDS
-- -----------------------------------------------------------------------------
INSERT INTO historical_yields (mine_id, recorded_date, target_tonnage, actual_tonnage, manganese_grade_pct, overburden_tonnage, recovery_rate_pct, operational_shifts)
VALUES
-- Balaghat
('b01a0001-0000-0000-0000-000000000001', '2026-05-01', 37500.0, 37100.0, 46.80, 8200.0, 98.93, 3),
('b01a0001-0000-0000-0000-000000000001', '2026-06-01', 37500.0, 36200.0, 46.50, 8500.0, 96.53, 3),
('b01a0001-0000-0000-0000-000000000001', '2026-07-01', 37500.0, 31800.0, 45.80, 7900.0, 84.80, 3),
('b01a0001-0000-0000-0000-000000000001', '2026-08-01', 37500.0, 29400.0, 44.90, 7100.0, 78.40, 3),

-- Dongri Buzurg
('b01a0001-0000-0000-0000-000000000002', '2026-05-01', 31500.0, 31200.0, 39.00, 92000.0, 99.05, 3),
('b01a0001-0000-0000-0000-000000000002', '2026-06-01', 31500.0, 30900.0, 38.20, 94000.0, 98.10, 3),
('b01a0001-0000-0000-0000-000000000002', '2026-07-01', 31500.0, 24100.0, 37.10, 61000.0, 76.51, 3),
('b01a0001-0000-0000-0000-000000000002', '2026-08-01', 31500.0, 21800.0, 36.40, 52000.0, 69.21, 3),

-- Mansar
('b01a0001-0000-0000-0000-000000000003', '2026-06-01', 18300.0, 17900.0, 41.20, 35000.0, 97.81, 3),
('b01a0001-0000-0000-0000-000000000003', '2026-07-01', 18300.0, 16100.0, 40.50, 28000.0, 87.98, 3),
('b01a0001-0000-0000-0000-000000000003', '2026-08-01', 18300.0, 14900.0, 39.80, 24000.0, 81.42, 3),

-- Chikla
('b01a0001-0000-0000-0000-000000000004', '2026-06-01', 15000.0, 14850.0, 44.00, 3100.0, 99.00, 3),
('b01a0001-0000-0000-0000-000000000004', '2026-07-01', 15000.0, 13400.0, 43.10, 2900.0, 89.33, 3),
('b01a0001-0000-0000-0000-000000000004', '2026-08-01', 15000.0, 12700.0, 42.60, 2700.0, 84.67, 3),

-- Kandri
('b01a0001-0000-0000-0000-000000000005', '2026-06-01', 13300.0, 13100.0, 40.80, 22000.0, 98.50, 3),
('b01a0001-0000-0000-0000-000000000005', '2026-07-01', 13300.0, 11500.0, 39.90, 18000.0, 86.47, 3),

-- Gumgaon
('b01a0001-0000-0000-0000-000000000006', '2026-06-01', 11600.0, 11400.0, 47.10, 2400.0, 98.28, 3),
('b01a0001-0000-0000-0000-000000000006', '2026-07-01', 11600.0, 10800.0, 46.50, 2200.0, 93.10, 3),

-- Tirodi
('b01a0001-0000-0000-0000-000000000007', '2026-06-01', 15800.0, 15600.0, 36.50, 48000.0, 98.73, 3),
('b01a0001-0000-0000-0000-000000000007', '2026-07-01', 15800.0, 13100.0, 35.80, 39000.0, 82.91, 3),

-- Ukwa
('b01a0001-0000-0000-0000-000000000008', '2026-06-01', 10000.0, 9850.0, 45.20, 1900.0, 98.50, 3),
('b01a0001-0000-0000-0000-000000000008', '2026-07-01', 10000.0, 9200.0, 44.70, 1800.0, 92.00, 3);

-- -----------------------------------------------------------------------------
-- 4. SEED WEATHER TELEMETRY (Recent radar & satellite observation series)
-- -----------------------------------------------------------------------------
INSERT INTO weather_telemetry (mine_id, timestamp, rainfall_mm, soil_moisture_pct, surface_temp_c, humidity_pct, wind_speed_kmh, satellite_ndvi, flood_risk_index)
VALUES
-- Balaghat (Moderate Rain)
('b01a0001-0000-0000-0000-000000000001', NOW() - INTERVAL '24 hours', 12.50, 54.00, 29.20, 75.0, 11.0, 0.460, 2.10),
('b01a0001-0000-0000-0000-000000000001', NOW() - INTERVAL '12 hours', 19.80, 58.20, 28.50, 78.0, 13.0, 0.455, 2.60),
('b01a0001-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour', 28.40, 62.50, 27.80, 82.0, 14.5, 0.450, 3.20),

-- Dongri Buzurg (Heavy Monsoon Inundation)
('b01a0001-0000-0000-0000-000000000002', NOW() - INTERVAL '24 hours', 42.00, 76.50, 27.00, 88.0, 20.0, 0.510, 5.80),
('b01a0001-0000-0000-0000-000000000002', NOW() - INTERVAL '12 hours', 64.50, 84.00, 26.10, 91.0, 24.5, 0.515, 7.20),
('b01a0001-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 78.60, 89.20, 25.40, 94.0, 28.0, 0.520, 8.40),

-- Mansar
('b01a0001-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour', 34.20, 68.00, 28.10, 80.0, 16.0, 0.420, 4.10),

-- Chikla
('b01a0001-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour', 45.00, 72.40, 26.90, 85.0, 18.5, 0.480, 5.00),

-- Kandri
('b01a0001-0000-0000-0000-000000000005', NOW() - INTERVAL '1 hour', 31.00, 65.80, 28.40, 79.0, 15.0, 0.410, 3.80),

-- Gumgaon
('b01a0001-0000-0000-0000-000000000006', NOW() - INTERVAL '1 hour', 22.00, 58.00, 29.00, 74.0, 12.0, 0.390, 2.70),

-- Tirodi
('b01a0001-0000-0000-0000-000000000007', NOW() - INTERVAL '1 hour', 52.30, 77.00, 26.50, 87.0, 22.0, 0.490, 6.10),

-- Ukwa
('b01a0001-0000-0000-0000-000000000008', NOW() - INTERVAL '1 hour', 18.50, 52.00, 29.50, 71.0, 10.5, 0.470, 2.20);

-- -----------------------------------------------------------------------------
-- 5. SEED SHORTFALL PREDICTIONS
-- -----------------------------------------------------------------------------
INSERT INTO shortfall_predictions (id, mine_id, prediction_timestamp, horizon_days, target_yield_mt, predicted_yield_mt, shortfall_tonnage, shortfall_risk_level, confidence_score, primary_failure_mode, features_snapshot, model_version)
VALUES
(
    'p01a0001-0000-0000-0000-000000000001',
    'b01a0001-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 hours',
    14,
    15000.00,
    10800.00,
    4200.00,
    'HIGH',
    0.9150,
    'Monsoon Pit Sump Overflow & Dumper Haulage Slippage',
    '{"rainfall_mm": 78.6, "soil_moisture_pct": 89.2, "dewatering_capacity_pct": 45.0, "active_haul_trucks": 2, "dumper_cycle_time_min": 36.5}'::jsonb,
    'v1.0.0-xgb'
),
(
    'p01a0001-0000-0000-0000-000000000002',
    'b01a0001-0000-0000-0000-000000000007',
    NOW() - INTERVAL '4 hours',
    14,
    8000.00,
    6200.00,
    1800.00,
    'MODERATE',
    0.8650,
    'Haul Road Saturated Rutting & Overburden Slippage',
    '{"rainfall_mm": 52.3, "soil_moisture_pct": 77.0, "dewatering_capacity_pct": 85.0, "active_haul_trucks": 1}'::jsonb,
    'v1.0.0-xgb'
),
(
    'p01a0001-0000-0000-0000-000000000003',
    'b01a0001-0000-0000-0000-000000000001',
    NOW() - INTERVAL '6 hours',
    14,
    18000.00,
    17400.00,
    600.00,
    'LOW',
    0.9420,
    'Normal Operations (Minor Drill Vibration Maintenance Pending)',
    '{"rainfall_mm": 28.4, "soil_moisture_pct": 62.5, "dewatering_capacity_pct": 92.0, "hoist_health_score": 94.5}'::jsonb,
    'v1.0.0-xgb'
);

-- -----------------------------------------------------------------------------
-- 6. SEED CORRECTIVE ACTIONS
-- -----------------------------------------------------------------------------
INSERT INTO corrective_actions (id, prediction_id, mine_id, action_type, title, description, priority, estimated_yield_recovery_mt, cost_estimate_inr, status, notes)
VALUES
(
    'a01a0001-0000-0000-0000-000000000001',
    'p01a0001-0000-0000-0000-000000000001',
    'b01a0001-0000-0000-0000-000000000002',
    'DEWATERING_MOBILIZATION',
    'Mobilize 2x 250HP Standby Diesel Pumps to Bench 4',
    'Deploy auxiliary dewatering skid to pit sump to evacuate 4,200 m3/hr excess water accumulation and prevent bench flooding.',
    'URGENT',
    2600.00,
    350000.00,
    'PROPOSED',
    'Authorized by DGMS Safety Protocol for monsoon surge management.'
),
(
    'a01a0001-0000-0000-0000-000000000002',
    'p01a0001-0000-0000-0000-000000000001',
    'b01a0001-0000-0000-0000-000000000002',
    'LOGISTICAL_REROUTE',
    'Activate North-Eastern Gravel Haulage Bypass',
    'Reroute CAT 773E dumpers away from inundated South incline to high-traction gravel bypass to maintain 85% hauling rate.',
    'HIGH',
    1100.00,
    75000.00,
    'PROPOSED',
    'Road stabilization crew dispatched with 40mm aggregate surfacing.'
),
(
    'a01a0001-0000-0000-0000-000000000003',
    'p01a0001-0000-0000-0000-000000000002',
    'b01a0001-0000-0000-0000-000000000007',
    'MAINTENANCE_ACCELERATION',
    'Deploy Mobile Grader to Restore Haul Road Traction',
    'Grade and re-crown central haul road between pit crest and primary crusher to eliminate surface water ponding.',
    'MEDIUM',
    800.00,
    45000.00,
    'PROPOSED',
    'Estimated execution window: 4 hours before next shift.'
);

-- -----------------------------------------------------------------------------
-- 7. SEED AUDIT LOGS
-- -----------------------------------------------------------------------------
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details)
VALUES
(
    'l01a0001-0000-0000-0000-000000000001',
    'system_init',
    'SYSTEM_BOOTSTRAP',
    'SYSTEM',
    'moil_master',
    '{"event": "Database seeded with 8 primary MOIL mines, telemetry sensors, and XGBoost prediction models.", "version": "1.0.0"}'::jsonb
),
(
    'l01a0001-0000-0000-0000-000000000002',
    'telemetry_agent',
    'TELEMETRY_INGESTION_CYCLE',
    'weather_telemetry',
    'b01a0001-0000-0000-0000-000000000002',
    '{"event": "Monsoon radar alert ingested for Dongri Buzurg: 78.6mm precipitation.", "alert_level": "RED"}'::jsonb
);
