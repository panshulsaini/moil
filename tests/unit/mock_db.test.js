/**
 * Tier 1 Unit Test: Supabase Data Layer & Mock Repository Query Builder
 * Verifies in-memory query chaining, CRUD operations, filters, and seed integrity.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { MOIL_MINES } = require('../helpers/sample_payloads');

// Authoritative MockSupabaseClient implementation conforming to @supabase/supabase-js
class MockSupabaseClient {
  constructor(customSeed = {}) {
    this.tables = {
      mines: JSON.parse(JSON.stringify(MOIL_MINES)),
      mining_equipment: [
        {
          id: 'e01a0001-0000-0000-0000-000000000001',
          mine_id: 'b01a0001-0000-0000-0000-000000000001',
          equipment_code: 'EQ-BAL-HOIST-01',
          name: 'Main Vertical Shaft Hoist #1',
          equipment_type: 'HOIST_WINCH',
          status: 'OPERATIONAL',
          health_score: 94.5,
          vibration_level_mm_s: 1.45,
          temp_celsius: 62.0,
        },
        {
          id: 'e01a0001-0000-0000-0000-000000000002',
          mine_id: 'b01a0001-0000-0000-0000-000000000001',
          equipment_code: 'EQ-BAL-PUMP-01',
          name: 'Sub-level Dewatering Pump Alpha',
          equipment_type: 'DEWATERING_PUMP',
          status: 'OPERATIONAL',
          health_score: 88.0,
          vibration_level_mm_s: 2.1,
          temp_celsius: 71.0,
        },
        {
          id: 'e01a0001-0000-0000-0000-000000000003',
          mine_id: 'b01a0001-0000-0000-0000-000000000002',
          equipment_code: 'EQ-DON-PUMP-01',
          name: 'Pit Sump Main Dewatering Pump',
          equipment_type: 'DEWATERING_PUMP',
          status: 'CRITICAL_FAILURE',
          health_score: 38.0,
          vibration_level_mm_s: 6.9,
          temp_celsius: 94.0,
        },
      ],
      weather_telemetry: [
        {
          id: 'w01a0001-0000-0000-0000-000000000001',
          mine_id: 'b01a0001-0000-0000-0000-000000000001',
          timestamp: new Date().toISOString(),
          rainfall_mm: 28.4,
          soil_moisture_pct: 62.5,
          surface_temp_c: 27.8,
          humidity_pct: 82.0,
          flood_risk_index: 3.2,
        },
      ],
      shortfall_predictions: [],
      corrective_actions: [
        {
          id: 'a01a0001-0000-0000-0000-000000000001',
          mine_id: 'b01a0001-0000-0000-0000-000000000002',
          action_type: 'DEWATERING_MOBILIZATION',
          title: 'Deploy High-Capacity Pumps',
          description: 'Deploy 2x auxiliary pumps to Bench 4.',
          priority: 'URGENT',
          status: 'PROPOSED',
          estimated_yield_recovery_mt: 2600.0,
          cost_estimate_inr: 350000.0,
        },
      ],
      ...customSeed,
    };
  }

  from(tableName) {
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    const tableData = this.tables[tableName];

    const query = {
      _data: [...tableData],
      _table: tableName,
      _parent: this,
      _single: false,
      _error: null,

      select(fields = '*') {
        return this;
      },

      eq(column, value) {
        this._data = this._data.filter((row) => row[column] === value);
        return this;
      },

      neq(column, value) {
        this._data = this._data.filter((row) => row[column] !== value);
        return this;
      },

      in(column, values) {
        this._data = this._data.filter((row) => values.includes(row[column]));
        return this;
      },

      order(column, { ascending = true } = {}) {
        this._data.sort((a, b) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
        return this;
      },

      limit(count) {
        this._data = this._data.slice(0, count);
        return this;
      },

      single() {
        this._single = true;
        return this._executeSingle();
      },

      maybeSingle() {
        this._single = true;
        if (this._data.length === 0) {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: this._data[0], error: null });
      },

      _executeSingle() {
        if (this._data.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
        }
        return Promise.resolve({ data: this._data[0], error: null });
      },

      insert(newRows) {
        const rowsToInsert = Array.isArray(newRows) ? newRows : [newRows];
        const inserted = rowsToInsert.map((row) => ({
          id: row.id || `gen-${Math.random().toString(36).substring(2, 11)}`,
          created_at: new Date().toISOString(),
          ...row,
        }));
        this._parent.tables[this._table].push(...inserted);
        return Promise.resolve({ data: Array.isArray(newRows) ? inserted : inserted[0], error: null });
      },

      update(updates) {
        return {
          eq: (col, val) => {
            let updatedCount = 0;
            const updatedRows = [];
            this._parent.tables[this._table] = this._parent.tables[this._table].map((row) => {
              if (row[col] === val) {
                const updated = { ...row, ...updates, updated_at: new Date().toISOString() };
                updatedRows.push(updated);
                updatedCount++;
                return updated;
              }
              return row;
            });
            return Promise.resolve({ data: updatedRows, count: updatedCount, error: null });
          },
        };
      },

      then(resolve, reject) {
        return Promise.resolve({ data: this._data, error: this._error }).then(resolve, reject);
      },
    };

    return query;
  }
}

describe('Tier 1: Mock Supabase Client & Query Engine Unit Tests', () => {
  let db;

  beforeEach(() => {
    db = new MockSupabaseClient();
  });

  it('should list all 8 MOIL mines from seed data', async () => {
    const { data: mines, error } = await db.from('mines').select('*');
    assert.equal(error, null);
    assert.equal(mines.length, 8);
    const codes = mines.map((m) => m.code);
    assert.ok(codes.includes('MOIL-BAL'));
    assert.ok(codes.includes('MOIL-DON'));
  });

  it('should filter mines by mine_type using .eq()', async () => {
    const { data: opencastMines } = await db.from('mines').select('*').eq('mine_type', 'OPENCAST');
    assert.equal(opencastMines.length, 2); // Dongri Buzurg, Tirodi
    opencastMines.forEach((m) => assert.equal(m.mine_type, 'OPENCAST'));

    const { data: undergroundMines } = await db.from('mines').select('*').eq('mine_type', 'UNDERGROUND');
    assert.equal(undergroundMines.length, 4); // Balaghat, Chikla, Gumgaon, Ukwa
  });

  it('should retrieve single mine by UUID using .single()', async () => {
    const balaghatId = 'b01a0001-0000-0000-0000-000000000001';
    const { data: mine, error } = await db.from('mines').select('*').eq('id', balaghatId).single();
    assert.equal(error, null);
    assert.equal(mine.name, 'Balaghat Mine');
    assert.equal(mine.code, 'MOIL-BAL');
  });

  it('should return error when .single() does not find a match', async () => {
    const { data, error } = await db.from('mines').select('*').eq('id', 'non-existent-uuid').single();
    assert.equal(data, null);
    assert.notEqual(error, null);
    assert.equal(error.code, 'PGRST116');
  });

  it('should support equipment filtering by mine_id', async () => {
    const balaghatId = 'b01a0001-0000-0000-0000-000000000001';
    const { data: equipment } = await db.from('mining_equipment').select('*').eq('mine_id', balaghatId);
    assert.equal(equipment.length, 2);
    assert.equal(equipment[0].equipment_code, 'EQ-BAL-HOIST-01');
  });

  it('should insert new shortfall predictions and query them back', async () => {
    const newPrediction = {
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      horizon_days: 14,
      target_yield_mt: 15000.0,
      predicted_yield_mt: 11000.0,
      shortfall_tonnage: 4000.0,
      shortfall_risk_level: 'HIGH',
      confidence_score: 0.92,
      primary_failure_mode: 'Pit Inundation',
    };

    const { data: inserted, error: insertErr } = await db.from('shortfall_predictions').insert(newPrediction);
    assert.equal(insertErr, null);
    assert.ok(inserted.id);

    const { data: queried } = await db.from('shortfall_predictions').select('*').eq('mine_id', newPrediction.mine_id);
    assert.equal(queried.length, 1);
    assert.equal(queried[0].shortfall_tonnage, 4000.0);
  });

  it('should update corrective action status from PROPOSED to ACKNOWLEDGED', async () => {
    const actionId = 'a01a0001-0000-0000-0000-000000000001';
    const { count, error } = await db.from('corrective_actions').update({ status: 'ACKNOWLEDGED' }).eq('id', actionId);
    assert.equal(error, null);
    assert.equal(count, 1);

    const { data: updatedAction } = await db.from('corrective_actions').select('*').eq('id', actionId).single();
    assert.equal(updatedAction.status, 'ACKNOWLEDGED');
  });
});
