/**
 * Tier 1 Unit Test: Mathematical Heuristics, Feature Engineering & Monotonicity
 * Verifies domain calculation formulas, mathematical properties, bounds, and edge cases.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Authoritative formula definitions from PROJECT.md & survey specs
function calculateEETI(fleetAvailabilityPct, activeExcavators, activeDumpers, unscheduledDowntimeHours) {
  const availRatio = fleetAvailabilityPct / 100.0;
  const rawThroughput = (activeExcavators * 120 + activeDumpers * 35) / 155.0;
  const downtimePenalty = 1.0 - Math.min(0.5, unscheduledDowntimeHours / 24.0);
  return availRatio * rawThroughput * downtimePenalty;
}

function calculatePMSI(rainfall24hMm, soilMoisturePct) {
  const rainPart = (rainfall24hMm / 50.0) * 40.0;
  const moisturePart = (soilMoisturePct / 100.0) * 60.0;
  return Math.min(100.0, Math.max(0.0, rainPart + moisturePart));
}

function calculateHRRM(soilMoisturePct, dumperCycleTimeMin) {
  const moisturePenalty = Math.max(0.0, ((soilMoisturePct - 50.0) / 50.0) * 0.75);
  const cyclePenalty = ((dumperCycleTimeMin - 15.0) / 15.0) * 0.25;
  return 1.0 + moisturePenalty + cyclePenalty;
}

function calculateDDR(rainfall24hMm, dewateringPumpCapacityM3hr) {
  const waterInflowEst = rainfall24hMm * 25.0;
  if (waterInflowEst <= 0) return 0.0;
  const deficit = (waterInflowEst - dewateringPumpCapacityM3hr) / Math.max(1.0, waterInflowEst);
  return Math.max(0.0, Math.min(1.0, deficit));
}

function calculateGDRF(targetGradePct, estimatedBlockGradePct, oreMoisturePct) {
  if (targetGradePct <= 0) return 0.0;
  const gradeGap = Math.max(0.0, (targetGradePct - estimatedBlockGradePct) / targetGradePct);
  const moisturePen = (oreMoisturePct / 30.0) * 0.15;
  return gradeGap + moisturePen;
}

function heuristicShortfallPredictor(params) {
  const pmsi = calculatePMSI(params.rainfall_24h_mm, params.soil_moisture_pct);
  const ddr = calculateDDR(params.rainfall_24h_mm, params.dewatering_pump_capacity_m3hr || 300.0);
  const eeti = calculateEETI(
    params.fleet_availability_pct,
    params.active_excavators,
    params.active_dumpers,
    params.unscheduled_downtime_hours
  );
  const ehp = ((params.maintenance_backlog_score || 2.0) / 10.0) * 0.5 +
    Math.min(0.5, (params.unscheduled_downtime_hours / 12.0) * 0.5);
  const gdrf = calculateGDRF(
    params.target_grade_mn_pct || 40.0,
    params.estimated_block_grade_mn_pct || 38.0,
    params.ore_moisture_pct || 5.0
  );
  const sbp = Math.max(0.0, ((params.stripping_ratio || 4.0) - 3.5) / 3.5);

  const weatherScore = (pmsi / 100.0) * 0.40 + ddr * 0.60;
  const equipScore = (1.0 - Math.min(1.0, eeti)) * 0.60 + ehp * 0.40;
  const geoScore = gdrf * 0.60 + Math.min(1.0, sbp) * 0.40;

  const rawProb = (weatherScore * 0.45) + (equipScore * 0.35) + (geoScore * 0.20);
  const prob = Math.max(0.02, Math.min(0.98, rawProb));
  const expectedShortfallTonnes = (params.planned_tonnage || 15000.0) * prob * 0.85;

  let riskLevel = 'LOW';
  if (prob >= 0.85) riskLevel = 'CRITICAL';
  else if (prob >= 0.65) riskLevel = 'HIGH';
  else if (prob >= 0.30) riskLevel = 'MODERATE';

  return {
    shortfall_probability: prob,
    expected_shortfall_tonnes: expectedShortfallTonnes,
    risk_level: riskLevel,
    pmsi,
    ddr,
    eeti,
    hrrm: calculateHRRM(params.soil_moisture_pct, params.dumper_cycle_time_min),
  };
}

describe('Tier 1: Mathematical Heuristics & Feature Monotonicity', () => {

  describe('Effective Equipment Throughput Index (EETI)', () => {
    it('should calculate correct EETI under optimal full fleet availability', () => {
      const eeti = calculateEETI(100.0, 1, 1, 0.0);
      assert.equal(Math.round(eeti * 1000) / 1000, 1.0);
    });

    it('should decrease monotonically as unscheduled downtime increases', () => {
      const eeti0 = calculateEETI(90.0, 4, 12, 0.0);
      const eeti4 = calculateEETI(90.0, 4, 12, 4.0);
      const eeti12 = calculateEETI(90.0, 4, 12, 12.0);
      assert.ok(eeti0 > eeti4, 'EETI at 0h downtime must be greater than at 4h');
      assert.ok(eeti4 > eeti12, 'EETI at 4h downtime must be greater than at 12h');
    });
  });

  describe('Precipitation-Moisture Stress Index (PMSI)', () => {
    it('should evaluate to 0 under dry zero-rainfall conditions', () => {
      const pmsi = calculatePMSI(0.0, 0.0);
      assert.equal(pmsi, 0.0);
    });

    it('should saturate at 100 under cloudburst storm conditions', () => {
      const pmsi = calculatePMSI(150.0, 95.0);
      assert.equal(pmsi, 100.0);
    });

    it('should increase monotonically with rainfall', () => {
      const p1 = calculatePMSI(10.0, 50.0);
      const p2 = calculatePMSI(30.0, 50.0);
      const p3 = calculatePMSI(60.0, 50.0);
      assert.ok(p1 < p2 && p2 < p3, 'PMSI must strictly increase with precipitation');
    });
  });

  describe('Haul Road Resistance Multiplier (HRRM)', () => {
    it('should have baseline 1.0 when moisture <= 50% and cycle time is nominal 15m', () => {
      const hrrm = calculateHRRM(40.0, 15.0);
      assert.equal(hrrm, 1.0);
    });

    it('should significantly increase under saturated haulage roads', () => {
      const hrrm = calculateHRRM(90.0, 30.0);
      // moisture penalty: (90-50)/50 * 0.75 = 0.60, cycle penalty: (30-15)/15 * 0.25 = 0.25 -> 1.85
      assert.equal(Math.round(hrrm * 100) / 100, 1.85);
    });
  });

  describe('Dewatering Deficit Ratio (DDR)', () => {
    it('should be 0 when pumping capacity exceeds storm water inflow', () => {
      // 10mm rain * 25 = 250 m3/hr inflow, 500 m3/hr pump -> 0 deficit
      const ddr = calculateDDR(10.0, 500.0);
      assert.equal(ddr, 0.0);
    });

    it('should approach 1.0 when pumps are disabled or overwhelmed during flash flood', () => {
      // 100mm rain * 25 = 2500 m3/hr inflow, 0 pump capacity -> 1.0 deficit
      const ddr = calculateDDR(100.0, 0.0);
      assert.equal(ddr, 1.0);
    });
  });

  describe('Overall Heuristic Shortfall Prediction Monotonicity & Risk Scaling', () => {
    it('should produce LOW risk for ideal sunny operating conditions', () => {
      const res = heuristicShortfallPredictor({
        rainfall_24h_mm: 0.0,
        soil_moisture_pct: 20.0,
        fleet_availability_pct: 95.0,
        active_excavators: 4,
        active_dumpers: 14,
        unscheduled_downtime_hours: 0.5,
        dumper_cycle_time_min: 16.0,
        dewatering_pump_capacity_m3hr: 500.0,
        planned_tonnage: 15000.0,
      });
      assert.ok(res.shortfall_probability < 0.30, `Expected prob < 0.30, got ${res.shortfall_probability}`);
      assert.equal(res.risk_level, 'LOW');
    });

    it('should produce HIGH or CRITICAL risk for severe monsoon storm + failed equipment', () => {
      const res = heuristicShortfallPredictor({
        rainfall_24h_mm: 110.0,
        soil_moisture_pct: 94.0,
        fleet_availability_pct: 45.0,
        active_excavators: 1,
        active_dumpers: 4,
        unscheduled_downtime_hours: 8.0,
        dumper_cycle_time_min: 48.0,
        dewatering_pump_capacity_m3hr: 50.0,
        planned_tonnage: 15000.0,
      });
      assert.ok(res.shortfall_probability >= 0.65, `Expected prob >= 0.65, got ${res.shortfall_probability}`);
      assert.ok(['HIGH', 'CRITICAL'].includes(res.risk_level));
      assert.ok(res.expected_shortfall_tonnes > 5000.0);
    });

    it('should guarantee probability bounds within [0.0, 1.0] across all extreme inputs', () => {
      const extremeInputs = [
        { rainfall_24h_mm: 500.0, soil_moisture_pct: 100.0, fleet_availability_pct: 0.0, active_excavators: 0, active_dumpers: 0, unscheduled_downtime_hours: 24.0, dumper_cycle_time_min: 180.0, dewatering_pump_capacity_m3hr: 0.0 },
        { rainfall_24h_mm: 0.0, soil_moisture_pct: 0.0, fleet_availability_pct: 100.0, active_excavators: 10, active_dumpers: 50, unscheduled_downtime_hours: 0.0, dumper_cycle_time_min: 1.0, dewatering_pump_capacity_m3hr: 5000.0 },
      ];
      extremeInputs.forEach((inp, idx) => {
        const res = heuristicShortfallPredictor(inp);
        assert.ok(res.shortfall_probability >= 0.0 && res.shortfall_probability <= 1.0, `Case ${idx} out of bounds: ${res.shortfall_probability}`);
      });
    });
  });
});
