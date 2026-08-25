/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — ALERT STATUS UPDATE ROUTE
 * =============================================================================
 * Route: PATCH /api/alerts/[id]
 * Updates operational status of corrective action items (PROPOSED -> ACKNOWLEDGED -> EXECUTED -> DISMISSED)
 * and records structured audit trail logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { AlertUpdateSchema, formatZodError } from '@/lib/validation';

const ParamsSchema = z.object({
  id: z.string().min(1, 'Alert ID is required'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paramValidation = ParamsSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert ID parameter',
            details: formatZodError(paramValidation.error),
          },
        },
        { status: 400 }
      );
    }

    const { id: alertId } = paramValidation.data;
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_BODY', message: 'Request body cannot be empty' } },
        { status: 400 }
      );
    }

    const validationResult = AlertUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid alert status update payload',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;
    const db = getSupabase();

    // Check if alert exists
    const { data: existingAlert, error: findError } = await db
      .from('corrective_actions')
      .select('*')
      .eq('id', alertId)
      .single();

    if (findError || !existingAlert) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Corrective action alert '${alertId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    const patchPayload: Record<string, any> = { status };
    if (notes) patchPayload.notes = notes;
    if (status === 'EXECUTED') patchPayload.executed_at = new Date().toISOString();

    const { data: updatedAlert, error: updateError } = await db
      .from('corrective_actions')
      .update(patchPayload)
      .eq('id', alertId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }

    // Write audit log
    await db.from('audit_logs').insert({
      user_id: 'operator',
      action: 'UPDATE_ALERT_STATUS',
      resource_type: 'corrective_actions',
      resource_id: alertId,
      details: { previous_status: existingAlert.status, new_status: status, notes },
    });

    return NextResponse.json({
      success: true,
      message: `Alert '${alertId}' status transitioned to '${status}'.`,
      data: updatedAlert,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to update corrective action alert',
        },
      },
      { status: 500 }
    );
  }
}
