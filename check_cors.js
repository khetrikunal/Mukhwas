const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForDeploy() {
  console.log('Waiting for Render to deploy new version...');
  let deployed = false;
  for (let i = 0; i < 60; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.get('https://mukhwas.onrender.com/actuator/health', { timeout: 10000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              console.log('Backend is UP! Health:', d.substring(0, 100));
              deployed = true;
            }
            resolve();
          });
        });
        req.on('error', reject);
        req.end();
      });
      if (deployed) break;
    } catch (e) {
      console.log('  Waiting... attempt', i + 1);
    }
    await sleep(10000);
  }

  if (!deployed) {
    console.log('Backend did not come up. Checking current CORS status anyway...');
  }

  // Test CORS preflight
  console.log('\nTesting CORS preflight request...');
  const opts = {
    method: 'OPTIONS',
    hostname: 'mukhwas.onrender.com',
    path: '/api/auth/login',
    headers: {
      'Origin': 'https://www.theroyalmukhwas.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization'
    },
    rejectUnauthorized: false
  };

  const req = https.request(opts, (res) => {
    console.log('OPTIONS Status:', res.statusCode);
    let hasAllowOrigin = false;
    Object.entries(res.headers).forEach(([k, v]) => {
      console.log('  ' + k + ':', v);
      if (k.toLowerCase() === 'access-control-allow-origin') {
        hasAllowOrigin = true;
      }
    });
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('Body:', body.substring(0, 200));
      if (hasAllowOrigin) {
        console.log('\n✓ CORS FIX WORKING! Access-Control-Allow-Origin is present.');
        console.log('  The preflight request will be accepted by the browser.');
      } else {
        console.log('\n✗ CORS FIX STILL NOT WORKING. Access-Control-Allow-Origin is MISSING.');
        console.log('  Check Render logs for build errors.');
      }
    });
  });
  req.on('error', e => console.log('Error:', e.message));
  req.end();
}

waitForDeploy();

