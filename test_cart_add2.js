/**
 * Test script: Login -> GET cart -> POST cart/add with REAL variant ID
 * Run: node test_cart_add2.js
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
  console.log('  CART ADD TEST V2 — WITH REAL VARIANT ID');
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
    // Print user info
    console.log(`   User role: ${loginData.data.role}`);
    console.log(`   User ID: ${loginData.data.id}`);
  } else {
    console.log('❌ Login failed:', loginRes.body.substring(0, 500));
    return;
  }

  // Step 2: Fetch admin products to get a real variant ID
  console.log('\n--- Step 2: Fetch admin products ---');
  const adminRes = await request('GET', '/api/admin/products?page=0&size=10');
  console.log(`Status: ${adminRes.status}`);
  let adminData;
  try { adminData = JSON.parse(adminRes.body); } catch(e) {}
  console.log(`Response body (first 2000 chars):`, adminRes.body.substring(0, 2000));

  // Try to extract variant ID
  let variantId = null;
  let variantLabel = null;
  let variantStock = null;
  
  if (adminData?.data?.content && adminData.data.content.length > 0) {
    console.log(`\nFound ${adminData.data.content.length} products`);
    for (const p of adminData.data.content) {
      console.log(`\nProduct: ${p.name} (${p.id})`);
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          console.log(`  Variant: ${v.id} | ${v.label} | stock=${v.stockQuantity} | retailPrice=${v.retailPrice}`);
          if (!variantId) {
            variantId = v.id;
            variantLabel = v.label;
            variantStock = v.stockQuantity;
          }
        }
      } else if (p.variants) {
        console.log(`  Variants array is empty`);
      } else {
        console.log(`  No variants property`);
      }
    }
  } else if (adminData?.data) {
    console.log(`\nAdmin response data structure:`, Object.keys(adminData.data));
    // Maybe it's not paginated?
    if (Array.isArray(adminData.data)) {
      console.log(`Data is an array of length ${adminData.data.length}`);
    } else if (adminData.data.content) {
      console.log(`Content is ${typeof adminData.data.content}, length ${adminData.data.content?.length}`);
    }
  } else {
    console.log(`\nCould not parse admin response. Full response:`, adminRes.body.substring(0, 3000));
  }

  // Step 3: Try POST /cart/add with REAL variant ID
  if (!variantId) {
    console.log('\n❌ Could not find any variant in admin products.');
    console.log('Trying to query the direct products endpoint...');
    
    const prodRes = await request('GET', '/api/products?page=0&size=10');
    console.log(`Products public status: ${prodRes.status}`);
    console.log(prodRes.body.substring(0, 1000));
    return;
  }

  console.log(`\n--- Step 3: GET /api/cart (before add) ---`);
  const cartRes = await request('GET', '/api/cart');
  console.log(`Status: ${cartRes.status}`);
  let cartData;
  try { cartData = JSON.parse(cartRes.body); } catch(e) {}
  if (cartRes.status === 200) {
    console.log(`✅ GET cart succeeded. Items: ${cartData?.data?.itemCount ?? '?'}`);
  }

  console.log(`\n--- Step 4: POST /api/cart/add with REAL variant ---`);
  console.log(`variantId=${variantId}, quantity=1`);
  console.log(`Variant details: label=${variantLabel}, stock=${variantStock}`);
  
  try {
    const addRes = await request('POST', '/api/cart/add', {
      variantId: variantId,
      quantity: 1,
    });
    console.log(`Status: ${addRes.status}`);
    try {
      const addData = JSON.parse(addRes.body);
      console.log(`Response: success=${addData.success}, message=${addData.message}`);
      if (addRes.status === 200) {
        console.log(`\n✅ POST /cart/add SUCCEEDED!`);
        console.log(`   Cart items: ${addData.data?.itemCount}`);
        if (addData.data?.items) {
          for (const item of addData.data.items) {
            console.log(`   Item: ${item.productName} x${item.quantity} = ₹${item.lineTotal}`);
          }
        }
      } else {
        console.log(`\n❌ POST /cart/add FAILED`);
        console.log(`   ${addData.message}`);
        console.log(`   Full response:`, JSON.stringify(addData, null, 2));
      }
    } catch(e) {
      console.log(`Raw body: ${addRes.body}`);
    }
  } catch (e) {
    console.log(`\n❌ Exception:`, e.message);
  }

  // Step 5: Verify GET cart still works
  console.log('\n--- Step 5: Verify GET /api/cart after add ---');
  const finalCartRes = await request('GET', '/api/cart');
  console.log(`Status: ${finalCartRes.status}`);
  try {
    const finalData = JSON.parse(finalCartRes.body);
    console.log(`Items: ${finalData?.data?.itemCount ?? '?'}`);
    console.log(`✅ GET cart works`);
    if (finalData?.data?.items) {
      for (const item of finalData.data.items) {
        console.log(`  ${item.productName} x${item.quantity} = ₹${item.lineTotal}`);
      }
    }
  } catch(e) {
    console.log(`Raw: ${finalCartRes.body.substring(0, 500)}`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);

