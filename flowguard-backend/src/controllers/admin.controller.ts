import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, PaginationMeta } from '../types';
import { clusterReportsByZone } from '../services/clustering.service';
import { notifyZone } from '../services/notification.service';

function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const total_pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────

/**
 * Returns an aggregate dashboard overview for admins.
 */
export async function getDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Counts in parallel
    const [
      { count: totalReports },
      { data: reportsByStatus },
      { data: reportsBySeverity },
      { data: codeRedZones },
      { count: activeSOS },
      { count: activeAlerts },
      { data: recentReports },
    ] = await Promise.all([
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('reports')
        .select('status')
        .then(({ data }) => {
          const grouped: Record<string, number> = {};
          for (const r of data ?? []) {
            grouped[r.status] = (grouped[r.status] ?? 0) + 1;
          }
          return { data: grouped };
        }),
      supabaseAdmin
        .from('reports')
        .select('severity')
        .then(({ data }) => {
          const grouped: Record<string, number> = {};
          for (const r of data ?? []) {
            grouped[r.severity] = (grouped[r.severity] ?? 0) + 1;
          }
          return { data: grouped };
        }),
      supabaseAdmin
        .from('zones')
        .select('*')
        .eq('risk_level', 'red'),
      supabaseAdmin
        .from('sos_events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabaseAdmin
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin
        .from('reports')
        .select('*, profiles!user_id(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_reports: totalReports ?? 0,
        reports_by_status: reportsByStatus ?? {},
        reports_by_severity: reportsBySeverity ?? {},
        code_red_zones: codeRedZones ?? [],
        active_sos: activeSOS ?? 0,
        active_alerts: activeAlerts ?? 0,
        recent_reports: recentReports ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/reports ───────────────────────────────────────────────────

/**
 * Returns all reports joined with reporter profile and zone, with filters/pagination.
 */
export async function getAllReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, severity, zone_id, category } = req.query;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt((req.query.limit as string) ?? '20', 10))
    );
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reports')
      .select('*, profiles!user_id(full_name, phone_number), zones(name)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status as string);
    if (severity) query = query.eq('severity', severity as string);
    if (zone_id) query = query.eq('zone_id', zone_id as string);
    if (category) query = query.eq('category', category as string);

    const { data: reports, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: reports ?? [],
      pagination: buildPaginationMeta(page, limit, count ?? 0),
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/reports/clustered ────────────────────────────────────────

/**
 * Triggers zone-level clustering analysis and returns escalated zones.
 */
export async function getClusteredReports(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const results = await clusterReportsByZone();

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/admin/reports/:id/status ─────────────────────────────────────

/**
 * Updates report status. Awards civic coins on resolution. Handles resolution photo upload.
 */
export async function updateReportStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    const file = req.file;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'status is required.',
        code: 400,
      });
      return;
    }

    // Fetch existing report to get user_id and current state
    const { data: existingReport, error: fetchError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingReport) {
      res.status(404).json({
        success: false,
        error: 'Report not found.',
        code: 404,
      });
      return;
    }

    const updatePayload: Record<string, unknown> = { status };
    if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;

    // Handle resolution
    if (status === 'resolved') {
      // Upload resolution photo if provided
      if (file) {
        const ext = file.mimetype.split('/')[1] ?? 'jpg';
        const storagePath = `reports/${existingReport.user_id}/resolution_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('reports')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Resolution photo upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('reports')
          .getPublicUrl(storagePath);

        updatePayload.resolution_photo_url = urlData.publicUrl;
      }

      // Award +10 civic coins to reporter (bypass RLS with supabaseAdmin)
      const { error: coinError } = await supabaseAdmin
        .from('profiles')
        .update({ civic_coins: existingReport.civic_coins + 10 })
        .eq('id', existingReport.user_id);

      if (coinError) {
        // Non-fatal — log but continue
        console.error(
          `[AdminController] Failed to award civic coins to user ${existingReport.user_id}:`,
          coinError.message
        );
      }

      // Correct approach: use rpc to increment
      await supabaseAdmin.rpc('increment_civic_coins', {
        user_id_param: existingReport.user_id,
        amount: 10,
      }).then(({ error }) => {
        if (error) {
          console.warn('[AdminController] RPC increment_civic_coins failed, used direct update instead.');
        }
      });
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('reports')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    res.status(200).json({
      success: true,
      message: `Report status updated to "${status}".`,
      data: updatedReport,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/sos ───────────────────────────────────────────────────────

/**
 * Returns all SOS events joined with user profile, ordered newest first.
 */
export async function getAllSOS(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('sos_events')
      .select('*, profiles(full_name, phone_number, role)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);

    const { data: events, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch SOS events: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      data: events ?? [],
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/admin/sos/:id ─────────────────────────────────────────────────

/**
 * Updates the status and notes of an SOS event.
 */
export async function updateSOSEvent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updatePayload: Record<string, unknown> = {};
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: updated, error } = await supabaseAdmin
      .from('sos_events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      res.status(404).json({
        success: false,
        error: 'SOS event not found.',
        code: 404,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'SOS event updated.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/admin/zones ─────────────────────────────────────────────────────

/**
 * Returns all zones with the current number of reports in each.
 */
export async function getAllZones(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: zones, error: zoneError } = await supabaseAdmin
      .from('zones')
      .select('*')
      .order('name', { ascending: true });

    if (zoneError) {
      throw new Error(`Failed to fetch zones: ${zoneError.message}`);
    }

    // Get report counts per zone
    const { data: reportCounts, error: countError } = await supabaseAdmin
      .from('reports')
      .select('zone_id')
      .not('zone_id', 'is', null);

    if (countError) {
      throw new Error(`Failed to fetch report counts: ${countError.message}`);
    }

    const countMap: Record<string, number> = {};
    for (const r of reportCounts ?? []) {
      if (r.zone_id) {
        countMap[r.zone_id] = (countMap[r.zone_id] ?? 0) + 1;
      }
    }

    const zonesWithCounts = (zones ?? []).map((z) => ({
      ...z,
      report_count: countMap[z.id] ?? 0,
    }));

    res.status(200).json({
      success: true,
      data: zonesWithCounts,
    });
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /api/admin/zones/:id/risk ─────────────────────────────────────────

/**
 * Manually overrides the risk level of a zone.
 */
export async function updateZoneRisk(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { risk_level } = req.body;

    const validLevels = ['normal', 'yellow', 'orange', 'red'];
    if (!risk_level || !validLevels.includes(risk_level)) {
      res.status(400).json({
        success: false,
        error: `risk_level must be one of: ${validLevels.join(', ')}.`,
        code: 400,
      });
      return;
    }

    const { data: zone, error } = await supabaseAdmin
      .from('zones')
      .update({ risk_level })
      .eq('id', id)
      .select()
      .single();

    if (error || !zone) {
      res.status(404).json({
        success: false,
        error: 'Zone not found.',
        code: 404,
      });
      return;
    }

    // If set to red, notify zone
    if (risk_level === 'red') {
      notifyZone(id, {
        id: 'manual-override',
        title: '⚠️ Zone Risk Escalated',
        message: 'This zone has been manually escalated to RED risk level by authorities.',
        severity_level: 'red',
      }).catch((err: unknown) => {
        console.error('[AdminController] Zone notification failed:', err);
      });
    }

    res.status(200).json({
      success: true,
      message: `Zone risk level updated to "${risk_level}".`,
      data: zone,
    });
  } catch (err) {
    next(err);
  }
}
