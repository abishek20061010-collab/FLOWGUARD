import axios from 'axios';
import { config } from '../config/env';
import { TriageResult } from '../types';

const MOCK_RESULT: TriageResult = {
  severity: 'medium',
  blockage_type: 'unknown',
  confidence: 0,
};

/**
 * Sends an image URL to the Python FastAPI triage microservice for ML analysis.
 * Falls back to a mock result if the service is unreachable or returns an error.
 * @param imageUrl - Public URL of the uploaded report image
 * @returns TriageResult containing severity, blockage_type, and confidence score
 */
export async function analyzeImage(imageUrl: string): Promise<TriageResult> {
  try {
    const response = await axios.post(
      `${config.triageService.url}/analyze`,
      { image_url: imageUrl },
      { timeout: 10000 }
    );

    const data = response.data as TriageResult;

    // Validate the expected shape
    if (data?.severity && data?.blockage_type && typeof data?.confidence === 'number') {
      return data;
    }

    console.warn(
      '[TriageService] Unexpected response shape from triage microservice. Using mock result.'
    );
    return MOCK_RESULT;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[TriageService] Triage service unreachable or returned error: ${msg}. Using mock result.`
    );
    return MOCK_RESULT;
  }
}
