/**
 * functionFetch - Raw HTTP wrapper for backend functions
 * Captures exact status, body, URL for evidence
 */

export async function callFunctionRaw(name, payload, { omitCredentials = false } = {}) {
  const url = `${window.location.origin}/api/v1/functions/${name}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: omitCredentials ? 'omit' : 'include',
      body: JSON.stringify(payload || {})
    });
    
    const text = await res.text();
    let json = null;
    
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Not JSON
    }
    
    return {
      url,
      status: res.status,
      statusText: res.statusText,
      text,
      json,
      timestamp: new Date().toISOString(),
      success: res.ok
    };
  } catch (networkError) {
    return {
      url,
      status: null,
      statusText: networkError.message,
      text: networkError.message,
      json: null,
      timestamp: new Date().toISOString(),
      success: false,
      networkError: true
    };
  }
}

/**
 * Format test result for display
 */
export function formatTestResult(testName, result) {
  return `[${result.success ? 'PASS' : 'FAIL'}] ${testName}
  URL: ${result.url}
  Status: ${result.status} ${result.statusText}
  Body: ${result.json ? JSON.stringify(result.json, null, 2) : result.text}
  Timestamp: ${result.timestamp}
`;
}

/**
 * Batch results for export
 */
export function formatBatchResults(tests) {
  const passed = tests.filter(t => t.result.success).length;
  const failed = tests.filter(t => !t.result.success).length;
  
  let output = `BATCH TEST RESULTS\n`;
  output += `Timestamp: ${new Date().toISOString()}\n`;
  output += `Passed: ${passed} | Failed: ${failed}\n\n`;
  
  tests.forEach(test => {
    output += formatTestResult(test.name, test.result);
    output += '\n';
  });
  
  return output;
}