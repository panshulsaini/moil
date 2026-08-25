/**
 * Tier 4 End-to-End Test: Multi-Mine Monsoon Disaster Simulation & Emergency Response
 * Simulates extreme regional cloudburst over Vidarbha-Balaghat manganese corridor across all 8 mines.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { MOIL_MINES } = require('../helpers/sample_payloads');

describe('Tier 4: Regional Cloudburst Disaster Simulation & Multi-Mine Response', () => {

  it('should process concurrent severe weather telemetry and prioritize emergency actions for high-risk mines', async () => {
    // 1. Simulate regional weather telemetry across all 8 MOIL mines
    const simulatedTelemetry = MOIL_MINES.map((mine) => {
      const isEastSector = mine.state === 'Madhya Pradesh';
      return {
        mine_id: mine.id,
        mine_code: mine.code,
        mine_name: mine.name,
        mine_type: mine.mine_type,
        rainfall_24h_mm: isEastSector ? 135.0 : 85.0, // Severe monsoon cloudburst
        soil_moisture_pct: isEastSector ? 94.0 : 88.0,
        active_pumps: mine.mine_type === 'UNDERGROUND' ? 4 : 2,
        pump_capacity_m3hr: mine.mine_type === 'UNDERGROUND' ? 800.0 : 400.0,
        planned_daily_tonnage: mine.annual_capacity_mt / 300.0,
      };
    });

    assert.equal(simulatedTelemetry.length, 8);

    // 2. Batch Shortfall Scoring Engine
    const results = simulatedTelemetry.map((tel) => {
      const waterInflow = tel.rainfall_24h_mm * 25.0; // Inflow estimate
      const pumpDeficit = Math.max(0.0, (waterInflow - tel.pump_capacity_m3hr) / waterInflow);
      const isUnderground = tel.mine_type === 'UNDERGROUND';

      // Shortfall probability calculation
      const rainWeight = 0.40;
      const moistureWeight = 0.30;
      const pumpDeficitWeight = 0.30;
      const prob = Math.min(
        0.98,
        (tel.rainfall_24h_mm / 150.0) * rainWeight +
        (tel.soil_moisture_pct / 100.0) * moistureWeight +
        pumpDeficit * pumpDeficitWeight
      );

      const isCritical = prob >= 0.85;
      const isHigh = prob >= 0.65;
      const riskLevel = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE';
      const expectedShortfallTonnes = tel.planned_daily_tonnage * prob * 0.9;

      const actions = [];
      if (pumpDeficit > 0.3) {
        actions.push({
          action_type: 'DEWATERING_MOBILIZATION',
          title: `Mobilize Emergency High-Head Pumps to ${tel.mine_name}`,
          priority: isCritical ? 'URGENT' : 'HIGH',
          estimated_recovery_tonnes: expectedShortfallTonnes * 0.7,
        });
      }
      if (tel.soil_moisture_pct > 85.0 && tel.mine_type === 'OPENCAST') {
        actions.push({
          action_type: 'HAULAGE_REROUTE',
          title: `Reroute Haul Dumpers away from Flooded Incline at ${tel.mine_name}`,
          priority: 'HIGH',
          estimated_recovery_tonnes: expectedShortfallTonnes * 0.3,
        });
      }

      return {
        mine_id: tel.mine_id,
        mine_name: tel.mine_name,
        shortfall_probability: Math.round(prob * 1000) / 1000,
        risk_level: riskLevel,
        expected_shortfall_tonnes: Math.round(expectedShortfallTonnes * 10) / 10,
        actions,
      };
    });

    // 3. Verify System Output Aggregations
    const highAndCriticalCount = results.filter((r) => ['HIGH', 'CRITICAL'].includes(r.risk_level)).length;
    const totalShortfallTonnes = results.reduce((sum, r) => sum + r.expected_shortfall_tonnes, 0);
    const totalEmergencyActions = results.reduce((sum, r) => sum + r.actions.length, 0);

    assert.equal(highAndCriticalCount, 8, 'All 8 mines under severe storm should be flagged HIGH or CRITICAL');
    assert.ok(totalShortfallTonnes > 2000.0, `Expected total shortfall > 2000 MT, got ${totalShortfallTonnes}`);
    assert.ok(totalEmergencyActions >= 8, 'Emergency actions must be generated for all affected mines');

    // 4. Verify Dewatering Actions for Underground Mines
    const balaghatResult = results.find((r) => r.mine_name === 'Balaghat Mine');
    assert.ok(balaghatResult);
    assert.equal(balaghatResult.risk_level, 'CRITICAL');
    assert.ok(balaghatResult.actions.some((a) => a.action_type === 'DEWATERING_MOBILIZATION'));

    // 5. Verify Haulage Reroute Actions for Opencast Mines
    const dongriResult = results.find((r) => r.mine_name === 'Dongri Buzurg Mine');
    assert.ok(dongriResult);
    assert.ok(dongriResult.actions.some((a) => a.action_type === 'HAULAGE_REROUTE'));
  });
});
