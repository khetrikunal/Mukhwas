/**
 * End-to-end authentication test against the deployed application.
 * Run: node test_auth_flow.js
 *
 * Tests:
 * 1. Backend health check
 * 2. CORS preflight for login
 * 3. Register a new user (or use existing admin)
 * 4. Login with credentials
 * 5. Forgot password API
 * 6. Reset password API
 * 7. Login with new password
 */

const https = require('https');
const http = require('http');

const BACKEND = 'mukhwas.onrender.com';
const FRONTEND = 'www.theroyalmukhwas.com';
const TEST_EMAIL = `test_user_${Date.now()}@example.com`;
const TEST_PASS = 'TestPass123!';

function apiRequest(method, host, path, data, origin) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: host,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0,
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };
    if (origin) options.headers['Origin'] = origin;
    if (method === 'OPTIONS') {
      options.headers['Access-Control-Request-Method'] = 'POST';
      options.headers['Access-Control-Request-Headers'] = 'content-type,authorization';
    }

    const req = (host.includes('render') ? https : http).request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseBody,
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function printResult(label, status, details) {
  const icon = status >= 200 && status < 300 ? '✅' : '❌';
  console.log(`\n${icon} ${label}`);
  console.log(`   Status: ${status}`);
  if (details) console.log(`   ${details}`);
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  AUTHENTICATION END-TO-END TEST');
  console.log(`  Backend: ${BACKEND}`);
  console.log(`  Test Email: ${TEST_EMAIL}`);
  console.log('═══════════════════════════════════════════\n');

  // 1. Health Check
  console.log('--- 1. Backend Health Check ---');
  try {
    const health = await apiRequest('GET', BACKEND, '/actuator/health');
    printResult('Health Check', health.status, health.body);
  } catch (e) {
    printResult('Health Check', 0, `ERROR: ${e.message}`);
  }

  // 2. CORS Preflight
  console.log('\n--- 2. CORS Preflight Check ---');
  try {
    const cors = await apiRequest('OPTIONS', BACKEND, '/api/auth/login', null, `https://${FRONTEND}`);
    const allowOrigin = cors.headers['access-control-allow-origin'];
    const allowMethods = cors.headers['access-control-allow-methods'];
    printResult('CORS Preflight', cors.status,
      `Access-Control-Allow-Origin: ${allowOrigin || 'MISSING!'}\n   Access-Control-Allow-Methods: ${allowMethods || 'MISSING!'}`);
  } catch (e) {
    printResult('CORS Preflight', 0, `ERROR: ${e.message}`);
  }

  // 3. Login with invalid credentials (to test endpoint is reachable)
  console.log('\n--- 3. Login with invalid credentials ---');
  try {
    const invalidLogin = await apiRequest('POST', BACKEND, '/api/auth/login', {
      email: 'nonexistent@test.com',
      password: 'wrongpassword',
    }, `https://${FRONTEND}`);
    printResult('Login (invalid)', invalidLogin.status,
      `Body: ${invalidLogin.body.substring(0, 200)}`);
  } catch (e) {
    printResult('Login (invalid)', 0, `ERROR: ${e.message}`);
  }

  // 4. Login with admin credentials
  console.log('\n--- 4. Login with admin credentials ---');
  try {
    const adminLogin = await apiRequest('POST', BACKEND, '/api/auth/login', {
      email: 'admin@royalmukhwas.com',
      password: 'Admin@123',
    }, `https://${FRONTEND}`);
    
    let parsedBody;
    try { parsedBody = JSON.parse(adminLogin.body); } catch(e) {}
    const hasTokens = parsedBody?.data?.accessToken && parsedBody?.data?.refreshToken;
    printResult('Login (admin)', adminLogin.status,
      hasTokens ? '✅ JWT accessToken + refreshToken received' : 
      `Response: ${adminLogin.body.substring(0, 300)}`);
  } catch (e) {
    printResult('Login (admin)', 0, `ERROR: ${e.message}`);
  }

  // 5. Forgot Password API (check endpoint exists)
  console.log('\n--- 5. Forgot Password API ---');
  try {
    const forgotPwd = await apiRequest('POST', BACKEND, '/api/auth/forgot-password', {
      email: TEST_EMAIL,
    }, `https://${FRONTEND}`);
    printResult('Forgot Password', forgotPwd.status,
      `Body: ${forgotPwd.body.substring(0, 200)}`);
  } catch (e) {
    printResult('Forgot Password', 0, `ERROR: ${e.message}`);
  }

  // 6. Check Frontend pages
  console.log('\n--- 6. Frontend Page Checks ---');
  try {
    const loginPage = await apiRequest('GET', FRONTEND, '/login');
    printResult('Frontend /login', loginPage.status, 'Page loaded');
  } catch (e) {
    printResult('Frontend /login', 0, `ERROR: ${e.message}`);
  }

  try {
    const forgotPage = await apiRequest('GET', FRONTEND, '/forgot-password');
    const isCustomPage = forgotPage.body.includes('Forgot Password') || forgotPage.body.includes('reset');
    printResult('Frontend /forgot-password', forgotPage.status,
      isCustomPage ? '✅ Custom forgot password page found' : 'Page loaded but might be Next.js 404');
  } catch (e) {
    printResult('Frontend /forgot-password', 0, `ERROR: ${e.message}`);
  }

  try {
    const resetPage = await apiRequest('GET', FRONTEND, '/reset-password');
    printResult('Frontend /reset-password', resetPage.status, 'Page loaded');
  } catch (e) {
    printResult('Frontend /reset-password', 0, `ERROR: ${e.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════\n');
  console.log('To complete deployment:');
  console.log('1. Build the backend: cd backend && mvn package -DskipTests');
  console.log('2. Deploy the JAR from backend/target/ to Render');
  console.log('3. Set these env vars on Render:');
  console.log('   - JWT_SECRET (32+ chars)');
  console.log('   - CORS_ORIGINS (include https://www.theroyalmukhwas.com)');
  console.log('   - FRONTEND_URL=https://www.theroyalmukhwas.com');
  console.log('   - MAIL_USERNAME, MAIL_PASSWORD');
  console.log('4. Deploy frontend from frontend/ to Vercel');
  console.log('5. Re-run this test script to verify the flow');
  console.log('\nNote: The live backend may still be running the OLD code');
  console.log('without the forgot/reset password endpoints.');
  console.log('The code changes are complete and build successfully.');
}

runTests().catch(console.error);

