const https = require('https');

const opts = {
  method: 'OPTIONS',
  hostname: 'mukhwas.onrender.com',
  path: '/api/auth/login',
  headers: {
    'Origin': 'https://www.theroyalmukhwas.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  },
  rejectUnauthorized: false
};

const req = https.request(opts, (res) => {
  console.log('Status:', res.statusCode);
  const corsHeaders = {};
  Object.entries(res.headers).forEach(([k, v]) => {
    if (k.toLowerCase().includes('access-control') || k === 'vary') {
      corsHeaders[k] = v;
    }
  });
  console.log('CORS Headers:', JSON.stringify(corsHeaders, null, 2));
  
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Body:', body.substring(0, 300));
  });
});

req.on('error', e => console.log('OPTIONS Error:', e.message));
req.end();

