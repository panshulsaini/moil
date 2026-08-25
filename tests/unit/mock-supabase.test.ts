/**
 * =============================================================================
 * UNIT TEST SUITE: MOCK SUPABASE CLIENT & FLUENT QUERY BUILDER
 * =============================================================================
 * Tests in-memory database queries, chaining, filtering, sorting, pagination,
 * mutations, and authentication mock endpoints.
 */

import { MockSupabaseClient } from '../../lib/supabase';

export function runMockSupabaseTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => Promise<void> | void) {
    try {
      const p = fn();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          results.push({ name, passed: true });
        }).catch((err) => {
          results.push({ name, passed: false, error: err.message || String(err) });
        });
      } else {
        results.push({ name, passed: true });
      }
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message || String(err) });
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  const client = new MockSupabaseClient();

  test('MockClient: Pre-loads exactly 8 primary MOIL mines on initialization', async () => {
    client.reset();
    const { data, count, error } = await client.from('mines').select('*');
    assert(!error, 'Query should not return error');
    assert(Array.isArray(data), 'Data should be an array');
    assert(data.length === 8, `Expected 8 MOIL mines, found ${data.length}`);
    assert(count === 8, `Expected count 8, got ${count}`);

    const codes = data.map((m: any) => m.code);
    assert(codes.includes('MOIL-BAL'), 'Must include Balaghat mine');
    assert(codes.includes('MOIL-DON'), 'Must include Dongri Buzurg mine');
    assert(codes.includes('MOIL-MAN'), 'Must include Mansar mine');
    assert(codes.includes('MOIL-CHK'), 'Must include Chikla mine');
  });

  test('MockClient: Filters with .eq() and retrieves single mine profile', async () => {
    const { data, error } = await client
      .from('mines')
      .select('*')
      .eq('code', 'MOIL-BAL')
      .single();

    assert(!error, 'Single query should succeed');
    assert(data !== null, 'Data should not be null');
    assert(data.name === 'Balaghat Mine', 'Name should match Balaghat Mine');
    assert(data.mine_type === 'UNDERGROUND', 'Mine type should be UNDERGROUND');
  });

  test('MockClient: Filters with comparison operators (.gt, .gte, .in)', async () => {
    const { data: highCapMines } = await client
      .from('mines')
      .select('*')
      .gte('annual_capacity_mt', 200000);

    assert(Array.isArray(highCapMines), 'Result must be array');
    assert(
      highCapMines.every((m: any) => m.annual_capacity_mt >= 200000),
      'All returned mines must have capacity >= 200,000 MT'
    );

    const { data: stateMines } = await client
      .from('mines')
      .select('*')
      .in('state', ['Madhya Pradesh']);

    assert(stateMines.length === 3, `Expected 3 MP mines (Balaghat, Tirodi, Ukwa), found ${stateMines.length}`);
  });

  test('MockClient: Orders results ascending and descending', async () => {
    const { data: ascMines } = await client
      .from('mines')
      .select('*')
      .order('established_year', { ascending: true });

    assert(ascMines[0].established_year <= ascMines[ascMines.length - 1].established_year, 'Ascending sort failed');

    const { data: descMines } = await client
      .from('mines')
      .select('*')
      .order('annual_capacity_mt', { ascending: false });

    assert(descMines[0].annual_capacity_mt >= descMines[descMines.length - 1].annual_capacity_mt, 'Descending sort failed');
  });

  test('MockClient: Slices results with .limit() and .range()', async () => {
    const { data: limited } = await client.from('mines').select('*').limit(3);
    assert(limited.length === 3, 'Limit(3) must return exactly 3 rows');

    const { data: ranged } = await client.from('mines').select('*').range(2, 4);
    assert(ranged.length === 3, 'Range(2, 4) must return 3 rows');
  });

  test('MockClient: Performs record mutations (.insert, .update, .delete)', async () => {
    // 1. Insert new test equipment
    const newEq = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-TEST-UNIT-01',
      name: 'Automated Test Conveyor Unit',
      equipment_type: 'CONVEYOR',
      status: 'OPERATIONAL',
      health_score: 98.0,
      vibration_level_mm_s: 1.0,
      temp_celsius: 55.0,
    };

    const { data: inserted } = await client.from('mining_equipment').insert(newEq);
    assert(inserted !== null, 'Insert must return new entity');
    assert(inserted.equipment_code === 'EQ-TEST-UNIT-01', 'Inserted code must match');

    // 2. Update equipment status
    const { data: updated } = await client
      .from('mining_equipment')
      .update({ status: 'MAINTENANCE_REQUIRED', health_score: 62.0 })
      .eq('equipment_code', 'EQ-TEST-UNIT-01');

    assert(updated.length > 0, 'Update must affect at least 1 row');
    assert(updated[0].status === 'MAINTENANCE_REQUIRED', 'Status must be updated');

    // 3. Delete equipment
    const { data: deleted } = await client
      .from('mining_equipment')
      .delete()
      .eq('equipment_code', 'EQ-TEST-UNIT-01');

    assert(deleted.length > 0, 'Delete must remove record');

    const { data: verifyFind } = await client
      .from('mining_equipment')
      .select('*')
      .eq('equipment_code', 'EQ-TEST-UNIT-01');

    assert(verifyFind.length === 0, 'Deleted record must not exist in table');
  });

  test('MockClient: Simulates Supabase auth methods', async () => {
    const userRes = await client.auth.getUser();
    assert(userRes.data.user !== null, 'getUser should return mock user');
    assert(userRes.data.user.email === 'operator@moil.nic.in', 'User email must match MOIL operator');

    const loginRes = await client.auth.signInWithPassword({
      email: 'operator@moil.nic.in',
      password: 'password123',
    });
    assert(loginRes.data.session !== null, 'signInWithPassword must return session token');
  });

  return results;
}
