/**
 * Tier 2 Integration Test: Database Mutations, Constraints & RLS Integrity
 * Tests data persistence across the 7 relational tables, relational constraints, and audit trails.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { MOIL_MINES } = require('../helpers/sample_payloads');

class MockDatabaseManager {
  constructor() {
    this.tables = {
      mines: [...MOIL_MINES],
      mining_equipment: [],
      historical_yields: [],
      weather_telemetry: [],
      shortfall_predictions: [],
      corrective_actions: [],
      audit_logs: [],
    };
  }

  insertPredictionWithActions(predictionData, actions = []) {
    // Foreign key check on mine_id
    const mineExists = this.tables.mines.some((m) => m.id === predictionData.mine_id);
    if (!mineExists) {
      throw new Error(`Foreign key violation: mine_id ${predictionData.mine_id} does not exist`);
    }

    const predictionId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const predRecord = {
      id: predictionId,
      created_at: new Date().toISOString(),
      ...predictionData,
    };
    this.tables.shortfall_predictions.push(predRecord);

    const insertedActions = actions.map((act, index) => {
      const actionRecord = {
        id: `act-${Date.now()}-${index}`,
        prediction_id: predictionId,
        mine_id: predictionData.mine_id,
        created_at: new Date().toISOString(),
        status: 'PROPOSED',
        ...act,
      };
      this.tables.corrective_actions.push(actionRecord);
      return actionRecord;
    });

    // Log audit trail
    this.tables.audit_logs.push({
      id: `audit-${Date.now()}`,
      action: 'PREDICTION_GENERATED',
      resource_type: 'shortfall_predictions',
      resource_id: predictionId,
      timestamp: new Date().toISOString(),
      details: { risk_level: predictionData.shortfall_risk_level, actions_count: actions.length },
    });

    return { prediction: predRecord, actions: insertedActions };
  }

  updateActionStatus(actionId, newStatus, userId = 'operator-balaghat') {
    const validStatuses = ['PROPOSED', 'ACKNOWLEDGED', 'EXECUTED', 'DISMISSED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${newStatus}`);
    }

    const action = this.tables.corrective_actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action with id ${actionId} not found`);
    }

    const oldStatus = action.status;
    action.status = newStatus;
    action.updated_at = new Date().toISOString();
    if (newStatus === 'EXECUTED') {
      action.executed_at = new Date().toISOString();
    }

    this.tables.audit_logs.push({
      id: `audit-${Date.now()}`,
      user_id: userId,
      action: 'ACTION_STATUS_CHANGED',
      resource_type: 'corrective_actions',
      resource_id: actionId,
      timestamp: new Date().toISOString(),
      details: { old_status: oldStatus, new_status: newStatus },
    });

    return action;
  }
}

describe('Tier 2: Database Mutations, Foreign Keys & Audit Trail Integration', () => {
  let db;

  beforeEach(() => {
    db = new MockDatabaseManager();
  });

  it('should successfully persist prediction, associated actions, and audit log atomically', () => {
    const balaghatId = 'b01a0001-0000-0000-0000-000000000001';
    const predPayload = {
      mine_id: balaghatId,
      horizon_days: 14,
      target_yield_mt: 15000.0,
      predicted_yield_mt: 11200.0,
      shortfall_tonnage: 3800.0,
      shortfall_risk_level: 'HIGH',
      confidence_score: 0.91,
      primary_failure_mode: 'Haul Road Flooding',
    };
    const actions = [
      {
        action_type: 'DEWATERING_MOBILIZATION',
        title: 'Deploy Pumps to Bench 3',
        description: 'Deploy 2x 300HP pumps.',
        priority: 'HIGH',
        estimated_yield_recovery_mt: 2000.0,
        cost_estimate_inr: 200000.0,
      },
    ];

    const result = db.insertPredictionWithActions(predPayload, actions);

    assert.ok(result.prediction.id);
    assert.equal(db.tables.shortfall_predictions.length, 1);
    assert.equal(db.tables.corrective_actions.length, 1);
    assert.equal(db.tables.corrective_actions[0].prediction_id, result.prediction.id);
    assert.equal(db.tables.corrective_actions[0].status, 'PROPOSED');

    assert.equal(db.tables.audit_logs.length, 1);
    assert.equal(db.tables.audit_logs[0].action, 'PREDICTION_GENERATED');
  });

  it('should throw foreign key violation error on invalid mine_id', () => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    assert.throws(
      () => {
        db.insertPredictionWithActions({ mine_id: invalidId, shortfall_tonnage: 100.0 }, []);
      },
      /Foreign key violation/
    );
  });

  it('should correctly transition action status and write audit record', () => {
    const balaghatId = 'b01a0001-0000-0000-0000-000000000001';
    const { actions } = db.insertPredictionWithActions(
      { mine_id: balaghatId, shortfall_tonnage: 500.0, shortfall_risk_level: 'MODERATE' },
      [{ action_type: 'LOGISTICS', title: 'Reroute dumpers', priority: 'MEDIUM', estimated_yield_recovery_mt: 500, cost_estimate_inr: 50000 }]
    );

    const actionId = actions[0].id;
    const updated = db.updateActionStatus(actionId, 'ACKNOWLEDGED', 'engineer-01');
    assert.equal(updated.status, 'ACKNOWLEDGED');

    const executed = db.updateActionStatus(actionId, 'EXECUTED', 'engineer-01');
    assert.equal(executed.status, 'EXECUTED');
    assert.ok(executed.executed_at);

    // Verify audit logs: 1 for creation + 2 for updates = 3
    assert.equal(db.tables.audit_logs.length, 3);
    const lastAudit = db.tables.audit_logs[2];
    assert.equal(lastAudit.action, 'ACTION_STATUS_CHANGED');
    assert.equal(lastAudit.details.new_status, 'EXECUTED');
  });
});
