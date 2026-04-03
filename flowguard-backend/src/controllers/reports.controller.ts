import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, PaginationMeta } from '../types';
import { getUserZone } from '../services/geofence.service';
import { analyzeImage } from '../services/triage.service';
import { clusterReportsByZone } from '../services/clustering.service';

// ─── Helper ───────────────────────────────────────────────────────────────────

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

// ─── POST /api/reports ────────────────────────────────────────────────────────

/**
 * Creates a new infrastructure report with photo upload, geofencing, and ML triage.
 */
export async function createReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, description, latitude, longitude } = req.body;
    const file = req.file;

    if (!category || !latitude || !longitude) {
      res.status(400).json({
        success: false,
        error: 'category, latitude, and longitude are required.',
        code: 400,
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'A photo is required for every report.',
        code: 400,
      });
      return;
    }

    const userId = req.user!.id;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // 1. Upload photo to Supabase Storage
    const ext = file.mimetype.split('/')[1] ?? 'jpg';
    const storagePath = `reports/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('reports')
      .getPublicUrl(storagePath);

    const photoUrl = urlData.publicUrl;

    // 2. Geofence — find zone
    const zone = await getUserZone(lat, lng);
    const zoneId = zone?.id ?? null;

    // 3. ML Triage
    const triage = await analyzeImage(photoUrl);

    // 4. Insert report
    const { data: report, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert({
        user_id: userId,
        category,
        description: description ?? null,
        latitude: lat,
        longitude: lng,
        photo_url: photoUrl,
        status: 'reported',
        severity: triage.severity,
        blockage_type: triage.blockage_type,
        zone_id: zoneId,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save report: ${insertError.message}`);
    }

    // 5. Run clustering check asynchronously — do not block response
    clusterReportsByZone().catch((err: unknown) => {
      console.error('[ReportsController] Clustering check failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/reports ─────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's own reports with optional filters and pagination.
 */
export async function getMyReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, category } = req.query;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) ?? '10', 10))
    );
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status as string);
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

// ─── GET /api/reports/:id ─────────────────────────────────────────────────────

/**
 * Returns a single report by ID. Citizens can only access their own reports.
 */
export async function getReportById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    let query = supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: report, error } = await query.single();

    if (error || !report) {
      res.status(404).json({
        success: false,
        error: 'Report not found or you do not have permission to view it.',
        code: 404,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}
