/**
 * Force-warm the backend by making a request first, THEN test login.
 * This simulates what happens when a page uses OPTIONS preflight + POST login
 * on a cold Render instance.
 */
const https = require('https');

function request(method, path, data, origin) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      method, hostname: 'mukhwas.onrender.com', path,
      headers: { 'Content-Type': 'application/json' },
      rejectUnauthorized: false, timeout: 60000
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    if (origin) opts.headers['Origin'] = origin;
    if (method === 'OPTIONS') {
      opts.headers['Access-Control-Request-Method'] = 'POST';
      opts.headers['Access-Control-Request-Headers'] = 'content-type,authorization';
    }

    const start = Date.now();
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, elapsed: Date.now() - start, body: d }));
    });
    req.on('timeout', () => {
      console.log(`  TIMEOUT after ${Date.now() - start}ms for ${method} ${path}`);
      req.destroy();
      resolve({ status: 0, elapsed: Date.now() - start, body: 'TIMEOUT' });
    });
    req.on('error', (e) => {
      console.log(`  ERROR after ${Date.now() - start}ms: ${e.message}`);
      resolve({ status: 0, elapsed: Date.now() - start, body: e.message });
    });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  SIMULATING BROWSER LOGIN FLOW');
  console.log('══════════════════════════════════════════════════\n');

  const origin = 'https://www.theroyalmukhwas.com';

  // Step 1: OPTIONS preflight (what browser does first)
  console.log('Step 1: OPTIONS preflight...');
  const opt = await request('OPTIONS', '/api/auth/login', null, origin);
  console.log(`  Status: ${opt.status}, Elapsed: ${opt.elapsed}ms`);

  // Step 2: POST login (what browser does after preflight)
  console.log('\nStep 2: POST login...');
  const log = await request('POST', '/api/auth/login', 
    { email: 'admin@royalmukhwas.com', password: 'Admin@123' }, origin);
  console.log(`  Status: ${log.status}, Elapsed: ${log.elapsed}ms`);

  // Check if total flow exceeds 8 seconds
  const total = opt.elapsed + log.elapsed;
  console.log(`\nTotal flow time: ${total}ms`);
  console.log(`Axios timeout: 8000ms`);

  if (total > 8000) {
    console.log('\n⚠️  CRITICAL FINDING: Total login flow exceeds Axios timeout!');
    console.log('   The OPTIONS preflight took ' + opt.elapsed + 'ms (causing cold start)');
    console.log('   Then POST took another ' + log.elapsed + 'ms');
    console.log('   Total = ' + total + 'ms > 8000ms (Axios timeout)');
    console.log('');
    console.log('   ROOT CAUSE: Axios timeout (8000ms) + Render cold start delay');
    console.log('   The browser cancels POST /api/auth/login as "Canceled"');
    console.log('   because Axios fires the timeout before the backend responds.');
    console.log('');
    console.log('   FIX: Increase timeout from 8000ms to at least 30000ms');
  } else {
    console.log('\n✅ Login flow completes within Axios timeout.');
  }
}

main().catch(console.error);

