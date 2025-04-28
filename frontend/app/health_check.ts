/**
 * Health check utility for the frontend
 *
 * This module provides functions to check the health and connectivity
 * of the backend API from the frontend.
 */

import { ApiClient } from './services/api';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number; // milliseconds
}

/**
 * List of important endpoints to check
 */
const ENDPOINTS_TO_CHECK = ['/health', '/templates/health', '/directories/health', '/templates/test', '/directories/test'];

/**
 * Check the health of a specific endpoint
 *
 * @param endpoint - The API endpoint to check
 * @returns Promise with health check result
 */
export async function checkEndpoint(endpoint: string): Promise {
  const start = performance.now();

  try {
    const result = await ApiClient.get(endpoint, { useAuth: false });
    const end = performance.now();

    return {
      endpoint,
      success: !result.error,
      data: result.data,
      error: result.error,
      responseTime: end - start,
    };
  } catch (error) {
    const end = performance.now();

    return {
      endpoint,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: end - start,
    };
  }
}

/**
 * Check the health of all important endpoints
 *
 * @returns Promise with array of health check results
 */
export async function checkAllEndpoints(): Promise {
  const results: HealthCheckResult[] = [];

  for (const endpoint of ENDPOINTS_TO_CHECK) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
  }

  return results;
}

/**
 * Format the health check results into a human-readable string
 *
 * @param results - Array of health check results
 * @returns Formatted string with results
 */
export function formatHealthCheckResults(results: HealthCheckResult[]): string {
  const allSuccessful = results.every((r) => r.success);
  const successCount = results.filter((r) => r.success).length;

  let output = `Health Check Results (${successCount}/${results.length} successful)\n`;
  output += '='.repeat(50) + '\n';

  for (const result of results) {
    const status = result.success ? '✅ OK' : '❌ FAIL';
    const time = `${Math.round(result.responseTime)}ms`;

    output += `${result.endpoint.padEnd(30)} ${status.padEnd(10)} ${time}\n`;

    if (!result.success && result.error) {
      output += `  Error: ${result.error}\n`;
    }
  }

  output += '='.repeat(50) + '\n';
  output += `Overall status: ${allSuccessful ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}\n`;

  return output;
}

/**
 * Run a health check and return the results
 * This is the main entry point for health checks
 *
 * @returns Promise with formatted health check results
 */
export async function runHealthCheck(): Promise {
  console.log('Running API health check...');

  try {
    const results = await checkAllEndpoints();
    return formatHealthCheckResults(results);
  } catch (error) {
    return `Error running health check: ${error instanceof Error ? error.message : String(error)}`;
  }
}
