/**
 * Next.js Route Integration Test Helper
 * Simulates NextRequest / Response dispatching to App Router route handlers.
 */

class MockNextRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.nextUrl = new URL(url, 'http://localhost:3000');
    this.method = options.method || 'GET';
    this.headers = new Headers(options.headers || {});
    this._body = options.body;
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body || {};
  }

  async text() {
    if (typeof this._body === 'string') return this._body;
    return JSON.stringify(this._body || {});
  }
}

/**
 * Creates an isolated mock Next.js App Router context
 */
function createMockApiContext(customDb = null, customFastApiUrl = null) {
  const { MOIL_MINES } = require('./sample_payloads');

  const inMemoryDb = customDb || {
    mines: [...MOIL_MINES],
    equipment: [
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
    alerts: [
      {
        id: 'a01a0001-0000-0000-0000-000000000001',
        mine_id: 'b01a0001-0000-0000-0000-000000000002',
        action_type: 'DEWATERING_MOBILIZATION',
        title: 'Deploy High-Capacity Pumps',
        description: 'Deploy auxiliary dewatering skid to pit sump.',
        priority: 'URGENT',
        status: 'PROPOSED',
        estimated_yield_recovery_mt: 2600.0,
        cost_estimate_inr: 350000.0,
        created_at: new Date().toISOString(),
      },
    ],
    predictions: [],
  };

  return {
    inMemoryDb,
    fastApiUrl: customFastApiUrl || 'http://127.0.0.1:8000',
  };
}

module.exports = {
  MockNextRequest,
  createMockApiContext,
};
