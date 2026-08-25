/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — ALERTS API ROUTE
 * =============================================================================
 * Route: GET /api/alerts, POST /api/alerts
 * Queries and creates operational corrective action alerts and reserve mitigation workflows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { AlertsQuerySchema, AlertCreateSchema, formatZodError } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};

    if (searchParams.has('mine_id')) queryObj.mine_id = searchParams.get('mine_id');
    if (searchParams.has('status')) queryObj.status = searchParams.get('status');
    if (searchParams.has('priority')) queryObj.priority = searchParams.get('priority');

    const validationResult = AlertsQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert query parameters',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { mine_id, status, priority } = validationResult.data;
    const db = getSupabase();

    let query = db.from('corrective_actions').select('*');
    if (mine_id) query = query.eq('mine_id', mine_id);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data: alerts, error } = await query.order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // Join mine metadata if needed
    const { data: mines } = await db.from('mines').select('id, name, code, state');
    const minesMap = new Map((mines || []).map((m: any) => [m.id, m]));

    const enrichedAlerts = (alerts || []).map((alert: any) => ({
      ...alert,
      mine: minesMap.get(alert.mine_id) || null,
    }));

    return NextResponse.json({
      success: true,
      count: enrichedAlerts.length,
      data: enrichedAlerts,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to fetch corrective action alerts',
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

    const validationResult = AlertCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert creation payload',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const newAlertData = {
      ...validationResult.data,
      status: 'PROPOSED',
      created_at: new Date().toISOString(),
    };

    const { data: newAlert, error } = await db.from('corrective_actions').insert(newAlertData);
    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    // Record audit log
    await db.from('audit_logs').insert({
      user_id: 'operator',
      action: 'CREATE_CORRECTIVE_ACTION',
      resource_type: 'corrective_actions',
      resource_id: newAlert?.id || 'new',
      details: { title: validationResult.data.title, priority: validationResult.data.priority },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Corrective action alert created successfully',
        data: newAlert,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to create corrective action alert',
        },
      },
      { status: 500 }
    );
  }
}
