/**
 * Test script for API connectivity
 *
 * This module provides functions to test the API connectivity
 * by making direct calls without authentication.
 *
 * Run this file directly using:
 * npx ts-node --project tsconfig.json app/test-api.ts
 */

import fetch from 'node-fetch';

// Default configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Test endpoints (unauthenticated)
const TEST_ENDPOINTS = ['/health', '/templates/health', '/directories/health', '/templates/test', '/directories/test'];

/**
 * Test an API endpoint
 * @param endpoint The endpoint path to test
 */
async function testEndpoint(endpoint: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Testing ${url}...`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Response status: ${response.status} (${responseTime}ms)`);

    if (response.ok) {
      const data = await response.json();

      // If it's a test endpoint, verify it has the expected structure
      if (endpoint.endsWith('/test')) {
        if (endpoint.includes('/templates')) {
          if (data.steps && Array.isArray(data.steps)) {
            console.log(`✅ Template endpoint has steps: ${data.steps.length}`);

            // Check if steps have substeps
            const hasSubsteps = data.steps.some((step: any) => step.subSteps && Array.isArray(step.subSteps) && step.subSteps.length > 0);

            if (hasSubsteps) {
              console.log(`✅ Template has steps with substeps`);
            } else {
              console.log(`❌ Template missing steps with substeps`);
            }
          } else {
            console.log(`❌ Template missing steps array`);
          }
        } else if (endpoint.includes('/directories')) {
          if (data.processes && Array.isArray(data.processes)) {
            console.log(`✅ Directory endpoint has processes: ${data.processes.length}`);

            // Check if processes have steps
            const hasSteps = data.processes.some((process: any) => process.steps && Array.isArray(process.steps) && process.steps.length > 0);

            if (hasSteps) {
              console.log(`✅ Directory processes have steps`);

              // Check if steps have substeps
              const hasSubsteps = data.processes.some(
                (process: any) => process.steps && process.steps.some((step: any) => step.subSteps && Array.isArray(step.subSteps) && step.subSteps.length > 0),
              );

              if (hasSubsteps) {
                console.log(`✅ Directory processes have steps with substeps`);
              } else {
                console.log(`❌ Directory processes missing steps with substeps`);
              }
            } else {
              console.log(`❌ Directory processes missing steps`);
            }
          } else {
            console.log(`❌ Directory missing processes array`);
          }
        }
      }

      console.log('Response preview:');
      console.log(JSON.stringify(data, null, 2).substring(0, 300) + '...');
      return true;
    } else {
      console.log(`❌ HTTP Error ${response.status}: ${response.statusText}`);
      try {
        const error = await response.text();
        console.log(`Error details: ${error.substring(0, 200)}`);
      } catch (e) {
        console.log('Could not read error details');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Run tests for all endpoints
 */
async function runTests() {
  console.log(`Testing API at ${API_BASE_URL}\n`);

  const results = [];

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`\n=== Testing ${endpoint} ===`);
    const success = await testEndpoint(endpoint);
    results.push({ endpoint, success });
  }

  // Print summary
  console.log('\n=== Summary ===');
  const successful = results.filter((r) => r.success).length;
  console.log(`${successful}/${results.length} tests passed\n`);

  for (const { endpoint, success } of results) {
    console.log(`${success ? '✅' : '❌'} ${endpoint}`);
  }

  // Exit with appropriate code
  process.exit(successful === results.length ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

export default runTests;
