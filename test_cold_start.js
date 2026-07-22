/**
 * Measure Render cold start time by timing the first request after inactivity.
 * Run: node test_cold_start.js
 *
 * Then we can compare with the Axios 8-second timeout in the frontend.
 */
const https = require('https');

function measureRequest(label) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = https.get('https://mukhwas.onrender.com/actuator/health', { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        console.log(`${label}: ${elapsed}ms (status ${res.statusCode})`);
        resolve(elapsed);
      });
    });
    req.on('timeout', () => {
      const elapsed = Date.now() - start;
      console.log(`${label}: TIMEOUT after ${elapsed}ms`);
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', (e) => {
      const elapsed = Date.now() - start;
      console.log(`${label}: ERROR after ${elapsed}ms: ${e.message}`);
      reject(e);
    });
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  RENDER COLD START MEASUREMENT');
  console.log('═══════════════════════════════════════════\n');
  console.log('Step 1: First request (likely cold start)...');
  await measureRequest('Cold start').catch(() => {});
  
  console.log('\nStep 2: Wait 2s and request again (should be warm)...');
  await new Promise(r => setTimeout(r, 2000));
  await measureRequest('Warm request').catch(() => {});

  console.log('\nStep 3: Test OPTIONS + POST login flow timing...');
  const loginStart = Date.now();
  
  // OPTIONS preflight
  const opts = {
    method: 'OPTIONS', hostname: 'mukhwas.onrender.com', path: '/api/auth/login',
    headers: {
      'Origin': 'https://www.theroyalmukhwas.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization'
    },
    rejectUnauthorized: false, timeout: 30000
  };
  
  await new Promise((resolve, reject) => {
    const preflightStart = Date.now();
    const preReq = https.request(opts, (res) => {
      console.log(`  OPTIONS preflight: ${Date.now() - preflightStart}ms (status ${res.statusCode})`);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', resolve);
    });
    preReq.on('error', reject);
    preReq.on('timeout', () => {
      console.log(`  OPTIONS preflight: TIMEOUT after ${Date.now() - preflightStart}ms`);
      preReq.destroy();
      reject(new Error('Timeout'));
    });
    preReq.end();
  }).catch(() => {});
  
  // Then POST login
  const postData = JSON.stringify({email: 'admin@royalmukhwas.com', password: 'Admin@123'});
  await new Promise((resolve, reject) => {
    const postStart = Date.now();
    const postReq = https.request({
      method: 'POST', hostname: 'mukhwas.onrender.com', path: '/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://www.theroyalmukhwas.com'
      },
      rejectUnauthorized: false, timeout: 30000
    }, (res) => {
      console.log(`  POST login: ${Date.now() - postStart}ms (status ${res.statusCode})`);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const hasToken = d.includes('accessToken');
        console.log(`  Has JWT token: ${hasToken}`);
        resolve();
      });
    });
    postReq.on('error', reject);
    postReq.on('timeout', () => {
      console.log(`  POST login: TIMEOUT after ${Date.now() - postStart}ms`);
      postReq.destroy();
      reject(new Error('Timeout'));
    });
    postReq.write(postData);
    postReq.end();
  }).catch(() => {});

  console.log(`\nTotal login flow: ${Date.now() - loginStart}ms`);
  console.log('\nAxios timeout configured in frontend: 8000ms (8 seconds)');
  console.log('');
  if (Date.now() - loginStart > 8000) {
    console.log('⚠️  DETECTED: Login flow takes longer than the 8-second Axios timeout!');
    console.log('   The browser will cancel the POST request when Axios times out.');
    console.log('   Fix: Increase Axios timeout from 8000 to at least 30000 (30 seconds)');
  } else {
    console.log('✅ Login flow completes within the 8-second Axios timeout.');
  }
}

main().catch(console.error);

