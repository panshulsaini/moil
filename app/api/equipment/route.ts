/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — EQUIPMENT API ROUTE
 * =============================================================================
 * Route: GET /api/equipment, POST /api/equipment
 * Manages mining machinery telemetry, operational status, vibration, and temperature.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { EquipmentQuerySchema, EquipmentCreateSchema, formatZodError } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};

    if (searchParams.has('mine_id')) queryObj.mine_id = searchParams.get('mine_id');
    if (searchParams.has('status')) queryObj.status = searchParams.get('status');
    if (searchParams.has('equipment_type')) queryObj.equipment_type = searchParams.get('equipment_type');

    const validationResult = EquipmentQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid equipment query parameters',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { mine_id, status, equipment_type } = validationResult.data;
    const db = getSupabase();

    let query = db.from('mining_equipment').select('*');
    if (mine_id) query = query.eq('mine_id', mine_id);
    if (status) query = query.eq('status', status);
    if (equipment_type) query = query.eq('equipment_type', equipment_type);

    const { data: equipment, error } = await query.order('health_score', { ascending: true });
    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: (equipment || []).length,
      data: equipment || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to fetch equipment records',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_BODY', message: 'Request body cannot be empty' } },
        { status: 400 }
      );
    }

    const validationResult = EquipmentCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid equipment payload',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const { data: newEquipment, error } = await db
      .from('mining_equipment')
      .insert(validationResult.data);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Equipment registered successfully',
        data: newEquipment,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to register equipment',
        },
      },
      { status: 500 }
    );
  }
}
