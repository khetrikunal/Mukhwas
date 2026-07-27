/**
 * Test script: Login -> GET cart -> POST cart/add to reproduce the 500 error.
 * Run: node test_cart_add.js
 */
const http = require('http');

const BASE = 'http://localhost:8080';
let JWT = null;

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      method,
      hostname: 'localhost',
      port: 8080,
      path,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    if (JWT) opts.headers['Authorization'] = `Bearer ${JWT}`;

    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: d });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  CART ADD TEST — LOCAL BACKEND');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Login as admin
  console.log('--- Step 1: Login ---');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin@royalmukhwas.com',
    password: 'Admin@123',
  });
  console.log(`Status: ${loginRes.status}`);
  let loginData;
  try { loginData = JSON.parse(loginRes.body); } catch(e) {}
  if (loginData?.data?.accessToken) {
    JWT = loginData.data.accessToken;
    console.log('✅ JWT token obtained');
  } else {
    console.log('❌ Login failed:', loginRes.body.substring(0, 300));
    return;
  }

  // Step 2: GET cart (should succeed)
  console.log('\n--- Step 2: GET /api/cart ---');
  const cartRes = await request('GET', '/api/cart');
  console.log(`Status: ${cartRes.status}`);
  let cartData;
  try { cartData = JSON.parse(cartRes.body); } catch(e) {}
  if (cartRes.status === 200) {
    console.log('✅ GET cart succeeded');
    console.log(`   Items: ${cartData?.data?.itemCount ?? '?'}`);
    console.log(`   Cart ID: ${cartData?.data?.id ?? '?'}`);
  } else {
    console.log('❌ GET cart failed:', cartRes.body.substring(0, 300));
  }

  // Step 3: First, find a valid variant ID from products endpoint
  console.log('\n--- Step 3: Find a variant ID from products ---');
  const prodRes = await request('GET', '/api/products?page=0&size=5');
  console.log(`Status: ${prodRes.status}`);
  let prodData;
  try { prodData = JSON.parse(prodRes.body); } catch(e) {}
  
  if (!prodData?.data?.content || prodData.data.content.length === 0) {
    console.log('No products found via API, will try a hardcoded UUID...');
  } else {
    console.log(`Found ${prodData.data.content.length} products`);
    // Just log product info
    for (const p of prodData.data.content) {
      console.log(`  Product: ${p.id} - ${p.name}`);
    }
  }

  // Step 4: Try POST /cart/add with a variant ID from products
  // Products don't embed variants in list response, so let's try fetching one product
  console.log('\n--- Step 4: Get product by slug to find variants ---');
  const slugRes = await request('GET', '/api/products/jaipuri-paan');
  console.log(`Status: ${slugRes.status}`);
  let slugData;
  try { slugData = JSON.parse(slugRes.body); } catch(e) {}
  
  let variantId = null;
  if (slugData?.data?.variants && slugData.data.variants.length > 0) {
    variantId = slugData.data.variants[0].id;
    console.log(`Found variant: ${variantId} (${slugData.data.variants[0].label})`);
  } else if (slugData?.data?.variants) {
    console.log('Product has no variants:', JSON.stringify(slugData.data.variants));
  } else {
    console.log('No variants in response. Response keys:', Object.keys(slugData?.data || {}));
  }

  // If we still don't have a variant, try querying admin products
  if (!variantId) {
    console.log('\n--- Trying admin products endpoint ---');
    const adminRes = await request('GET', '/api/admin/products?page=0&size=1');
    console.log(`Status: ${adminRes.status}`);
    let adminData;
    try { adminData = JSON.parse(adminRes.body); } catch(e) {}
    
    if (adminData?.data?.content && adminData.data.content.length > 0) {
      const variants = adminData.data.content[0].variants;
      if (variants && variants.length > 0) {
        variantId = variants[0].id;
        console.log(`Found variant from admin endpoint: ${variantId}`);
      }
    }
  }

  // Step 5: POST /cart/add — THE CRITICAL TEST
  if (!variantId) {
    console.log('\n❌ Could not find any variant. Using a test UUID...');
    variantId = '00000000-0000-0000-0000-000000000001';
  }

  console.log(`\n--- Step 5: POST /api/cart/add with variantId=${variantId}, quantity=1 ---`);
  try {
    const addRes = await request('POST', '/api/cart/add', {
      variantId: variantId,
      quantity: 1,
    });
    console.log(`Status: ${addRes.status}`);
    console.log(`Response headers:`, JSON.stringify(addRes.headers, null, 2));
    console.log(`Response body:`, addRes.body.substring(0, 2000));

    if (addRes.status === 200) {
      console.log('\n✅ POST /cart/add SUCCEEDED!');
    } else {
      console.log(`\n❌ POST /cart/add FAILED with status ${addRes.status}`);
      try {
        const errData = JSON.parse(addRes.body);
        console.log(`   Error message: ${errData.message}`);
        console.log(`   Success: ${errData.success}`);
      } catch(e) {
        console.log(`   Raw body: ${addRes.body}`);
      }
    }
  } catch (e) {
    console.log(`\n❌ POST /cart/add threw exception:`, e.message);
  }

  // Step 6: Verify GET cart still works
  console.log('\n--- Step 6: Verify GET /api/cart after add ---');
  const finalCartRes = await request('GET', '/api/cart');
  console.log(`Status: ${finalCartRes.status}`);
  let finalCartData;
  try { finalCartData = JSON.parse(finalCartRes.body); } catch(e) {}
  if (finalCartRes.status === 200) {
    console.log(`Items: ${finalCartData?.data?.itemCount ?? '?'}`);
    console.log(`✅ GET cart still works`);
  } else {
    console.log('❌ GET cart failed:', finalCartRes.body.substring(0, 300));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);

