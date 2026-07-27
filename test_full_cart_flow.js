/**
 * Complete test: seed data, then test POST /cart/add
 * Run: node test_full_cart_flow.js
 */
const http = require('http');
let JWT = null;

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      method, hostname: 'localhost', port: 8080, path,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  FULL CART FLOW TEST');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Login as admin
  const loginRes = await request('POST', '/api/auth/login',
    { email: 'admin@royalmukhwas.com', password: 'Admin@123' });
  const loginData = JSON.parse(loginRes.body);
  JWT = loginData.data.accessToken;
  console.log('✅ Admin logged in');

  // Step 2: Register test customer
  await request('POST', '/api/auth/register',
    { name: 'Test User', email: 'test@example.com', phone: '9999999999', password: 'Test@123' });
  const custLogin = await request('POST', '/api/auth/login',
    { email: 'test@example.com', password: 'Test@123' });
  const CUST_JWT = JSON.parse(custLogin.body).data.accessToken;
  console.log('✅ Customer registered & logged in');

  // Step 3: Create category (POST /api/categories, @PreAuthorize hasRole ADMIN)
  const catRes = await request('POST', '/api/categories',
    { name: 'Test Category', slug: 'test-category', description: 'Testing' }, JWT);
  const catData = JSON.parse(catRes.body);
  const catId = catData?.data?.id;
  console.log(`✅ Category created: ${catId}`);

  // Step 4: Create product (POST /api/admin/products)
  const prodRes = await request('POST', '/api/admin/products', {
    name: 'Test Product', slug: 'test-product', description: 'For cart testing',
    categoryId: catId, isActive: true, isFeatured: false,
    metaTitle: 'Test Product',
  }, JWT);
  const prodData = JSON.parse(prodRes.body);
  const productId = prodData?.data?.id;
  console.log(`✅ Product created: ${productId}`);

  // Step 5: Add variant (POST /api/admin/products/{id}/variants)
  // Note: This endpoint returns ProductVariant entity which may cause Jackson
  // serialization issues with Hibernate proxies. We create it anyway - it's saved in DB.
  const varRes = await request('POST', `/api/admin/products/${productId}/variants`, {
    weightGrams: 100, label: '100 gm', retailPrice: 100.00,
    wholesalePrice: 70.00, moq: 10, stockQuantity: 500,
    sku: 'TEST-100', isActive: true,
  }, JWT);
  console.log(`Add variant response status: ${varRes.status}`);
  
  // Get variant ID by fetching the product again
  let variantId = null;
  const prodGetRes = await request('GET', `/api/admin/products/${productId}`, null, JWT);
  const prodGetData = JSON.parse(prodGetRes.body);
  if (prodGetData?.data?.variants && prodGetData.data.variants.length > 0) {
    variantId = prodGetData.data.variants[0].id;
    console.log(`✅ Variant found: ${variantId} (stock=${prodGetData.data.variants[0].stockQuantity})`);
  } else {
    console.log('❌ Could not find variant after creation');
    console.log(prodGetRes.body.substring(0, 1000));
    return;
  }

  // Step 6: GET cart as customer (should succeed)
  console.log('\n--- Step 6: GET /api/cart ---');
  const cartRes = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${cartRes.status} (expected 200)`);

  // Step 7: POST /cart/add — THE CRITICAL TEST
  console.log('\n--- Step 7: POST /api/cart/add --- THE CRITICAL TEST ---');
  console.log(`Sending: variantId=${variantId}, quantity=1`);
  const addRes = await request('POST', '/api/cart/add',
    { variantId, quantity: 1 }, CUST_JWT);
  console.log(`Status: ${addRes.status}`);
  let addData;
  try { addData = JSON.parse(addRes.body); } catch(e) {}
  if (addData) {
    console.log(`Response: success=${addData.success}, message=${addData.message}`);
    if (addRes.status === 200) {
      console.log(`\n✅✅✅ POST /cart/add SUCCEEDED!`);
      console.log(`   Items: ${addData.data?.itemCount}`);
      if (addData.data?.items) {
        for (const item of addData.data.items) {
          console.log(`   - ${item.productName} x${item.quantity} @ ₹${item.unitPrice} = ₹${item.lineTotal}`);
        }
      }
    } else {
      console.log(`\n❌❌❌ POST /cart/add FAILED`);
      console.log(`   Full: ${JSON.stringify(addData, null, 2)}`);
    }
  } else {
    console.log(`\n❌❌❌ Raw response: ${addRes.body.substring(0, 2000)}`);
  }

  // Step 8: GET cart after add
  console.log('\n--- Step 8: GET /api/cart (after add) ---');
  const finalRes = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${finalRes.status}`);
  try {
    const finalData = JSON.parse(finalRes.body);
    console.log(`Items: ${finalData.data?.itemCount}`);
    if (finalRes.status === 200) console.log('✅ GET cart works');
  } catch(e) {}

  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('  Check the backend terminal for DEBUG logs!');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);

