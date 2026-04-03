import { supabaseAdmin } from '../config/supabase';
import { notifyZone } from './notification.service';

export interface ClusterResult {
  zone_id: string;
  zone_name: string;
  report_count: number;
  risk_level: string;
  alert_created: boolean;
}

/**
 * Scans all 'reported' reports, groups them by zone, and escalates any zone
 * with 3 or more reports to risk_level = 'red'.
 * Creates a 'flood' alert if none exists for that zone, and notifies subscribers.
 * @returns Array of ClusterResult objects for zones that hit the threshold
 */
export async function clusterReportsByZone(): Promise<ClusterResult[]> {
  // Fetch all unresolved reported reports with zone info
  const { data: reports, error: reportsError } = await supabaseAdmin
    .from('reports')
    .select('id, zone_id, zones(id, name)')
    .eq('status', 'reported')
    .not('zone_id', 'is', null);

  if (reportsError) {
    throw new Error(`Failed to fetch reports for clustering: ${reportsError.message}`);
  }

  if (!reports || reports.length === 0) {
    return [];
  }

  // Group reports by zone_id
  const zoneCounts = new Map<string, { name: string; count: number }>();

  for (const report of reports) {
    const zoneId = report.zone_id as string;
    const zoneName =
      (report.zones as { name?: string } | null)?.name ?? 'Unknown Zone';

    if (!zoneCounts.has(zoneId)) {
      zoneCounts.set(zoneId, { name: zoneName, count: 0 });
    }
    zoneCounts.get(zoneId)!.count += 1;
  }

  const results: ClusterResult[] = [];

  for (const [zoneId, info] of zoneCounts.entries()) {
    if (info.count < 3) continue;

    // Escalate zone risk level to red
    const { error: updateError } = await supabaseAdmin
      .from('zones')
      .update({ risk_level: 'red' })
      .eq('id', zoneId);

    if (updateError) {
      console.error(
        `[ClusteringService] Failed to update risk_level for zone ${zoneId}:`,
        updateError.message
      );
    }

    // Check if an active flood alert already exists
    const { data: existingAlerts } = await supabaseAdmin
      .from('alerts')
      .select('id')
      .eq('zone_id', zoneId)
      .eq('alert_type', 'flood')
      .eq('is_active', true)
      .limit(1);

    let alertCreated = false;

    if (!existingAlerts || existingAlerts.length === 0) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: newAlert, error: alertError } = await supabaseAdmin
        .from('alerts')
        .insert({
          zone_id: zoneId,
          alert_type: 'flood',
          severity_level: 'red',
          title: '🌊 Flood Risk: Multiple Reports Detected',
          message: `${info.count} infrastructure issues reported in ${info.name}. Risk level elevated to RED. Avoid the area.`,
          is_active: true,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (alertError) {
        console.error(
          `[ClusteringService] Failed to create flood alert for zone ${zoneId}:`,
          alertError.message
        );
      } else if (newAlert) {
        alertCreated = true;

        // Notify zone users asynchronously
        notifyZone(zoneId, newAlert).catch((err: unknown) => {
          console.error(
            `[ClusteringService] Failed to notify zone ${zoneId}:`,
            err
          );
        });
      }
    }

    results.push({
      zone_id: zoneId,
      zone_name: info.name,
      report_count: info.count,
      risk_level: 'red',
      alert_created: alertCreated,
    });
  }

  return results;
}
