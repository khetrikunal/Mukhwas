/**
 * Test CORS preflight requesting BOTH content-type AND authorization headers
 * (simulating what happens in the browser when a stale JWT token exists in localStorage)
 */
const https = require('https');

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

console.log('Sending OPTIONS preflight requesting headers: content-type, authorization');
console.log('Origin: https://www.theroyalmukhwas.com');
console.log('');

const req = https.request(opts, (res) => {
  console.log('Status:', res.statusCode);
  console.log('');
  
  let hasAllowOrigin = false;
  let hasAllowHeaders = false;
  let allowHeaders = '';
  
  Object.entries(res.headers).forEach(([k, v]) => {
    if (k.toLowerCase().includes('access-control') || k === 'vary') {
      console.log(`  ${k}: ${v}`);
      if (k.toLowerCase() === 'access-control-allow-origin') hasAllowOrigin = true;
      if (k.toLowerCase() === 'access-control-allow-headers') {
        hasAllowHeaders = true;
        allowHeaders = v;
      }
    }
  });
  
  console.log('');
  if (hasAllowOrigin) {
    console.log('✓ Access-Control-Allow-Origin is present');
  } else {
    console.log('✗ Access-Control-Allow-Origin is MISSING');
  }
  
  if (hasAllowHeaders) {
    const includesAuth = allowHeaders.toLowerCase().includes('authorization') || allowHeaders === '*';
    if (includesAuth) {
      console.log('✓ Access-Control-Allow-Headers includes "authorization"');
    } else {
      console.log('✗ Access-Control-Allow-Headers does NOT include "authorization"');
      console.log('  THIS WILL CAUSE THE BROWSER TO CANCEL THE REQUEST!');
    }
  } else {
    console.log('✗ Access-Control-Allow-Headers is MISSING');
  }
  
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    if (body) console.log('\nBody:', body.substring(0, 200));
  });
});

req.on('error', e => console.log('Error:', e.message));
req.end();

