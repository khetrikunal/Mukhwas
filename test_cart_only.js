/**
 * Minimal test: query existing data and test POST /cart/add
 * Run: node test_cart_only.js
 */
const http = require('http');

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
  console.log('  MINIMAL CART ADD TEST');
  console.log('═══════════════════════════════════════════\n');

  // Login as admin and customer
  const loginRes = await request('POST', '/api/auth/login',
    { email: 'admin@royalmukhwas.com', password: 'Admin@123' });
  const JWT = JSON.parse(loginRes.body).data.accessToken;
  
  const custLogin = await request('POST', '/api/auth/login',
    { email: 'test@example.com', password: 'Test@123' });
  const custBody = JSON.parse(custLogin.body);
  
  let CUST_JWT;
  if (custBody.data?.accessToken) {
    CUST_JWT = custBody.data.accessToken;
    console.log('✅ Customer logged in');
  } else {
    // Register customer first
    console.log('Registering customer...');
    await request('POST', '/api/auth/register',
      { name: 'Test User', email: 'test@example.com', phone: '9999999999', password: 'Test@123' });
    const cl2 = await request('POST', '/api/auth/login',
      { email: 'test@example.com', password: 'Test@123' });
    CUST_JWT = JSON.parse(cl2.body).data.accessToken;
    console.log('✅ Customer registered & logged in');
  }

  // Get admin products to find an existing variant
  const prodRes = await request('GET', '/api/admin/products?page=0&size=20', null, JWT);
  const prodData = JSON.parse(prodRes.body);
  console.log(`Admin products found: ${prodData?.data?.totalElements || 0}`);
  
  let variantId = null;
  let variantInfo = null;

  if (prodData?.data?.content?.length > 0) {
    for (const p of prodData.data.content) {
      if (p.variants && p.variants.length > 0) {
        variantId = p.variants[0].id;
        variantInfo = `${p.name} / ${p.variants[0].label} (stock=${p.variants[0].stockQuantity})`;
        console.log(`✅ Found variant: ${variantId}`);
        console.log(`   Info: ${variantInfo}`);
        break;
      }
    }
  }

  // If no products exist, create minimal test data
  if (!variantId) {
    console.log('\nNo products found. Creating test data...');
    
    // Get or create category (check if test-category exists first)
    const catListRes = await request('GET', '/api/categories', null, null);
    const catList = JSON.parse(catListRes.body);
    let catId = null;
    if (catList?.data) {
      const existing = catList.data.find(c => c.slug === 'test-category');
      if (existing) catId = existing.id;
    }
    
    if (!catId) {
      const catRes = await request('POST', '/api/categories',
        { name: 'Test Cat ' + Date.now(), slug: 'test-cat-' + Date.now(), description: 'Temp' }, JWT);
      catId = JSON.parse(catRes.body).data?.id;
      console.log(`Category created: ${catId}`);
    } else {
      console.log(`Using existing category: ${catId}`);
    }

    // Create product
    const prodCreateRes = await request('POST', '/api/admin/products', {
      name: 'Test Product ' + Date.now(), slug: 'test-prod-' + Date.now(),
      description: 'For cart testing', categoryId: catId,
      isActive: true, isFeatured: false, metaTitle: 'Test',
    }, JWT);
    const prodData2 = JSON.parse(prodCreateRes.body);
    const productId = prodData2?.data?.id;
    console.log(`Product created: ${productId}`);

    // Add variant directly by ID (skip the addVariant endpoint which has serialization issues)
    // Use the ProductVariantRepository directly via a product update... 
    // Actually, let's just insert the variant via the addVariant endpoint
    const varRes = await request('POST', `/api/admin/products/${productId}/variants`, {
      weightGrams: 100, label: '100 gm', retailPrice: 100.00,
      wholesalePrice: 70.00, moq: 10, stockQuantity: 500,
      sku: 'SKU-' + Date.now(), isActive: true,
    }, JWT);
    console.log(`Add variant status: ${varRes.status}`);
    // The addVariant endpoint returns entity with lazy proxy - ignore the response
    // Get the variant ID by fetching the product
    const prodGetRes = await request('GET', `/api/admin/products/${productId}`, null, JWT);
    const prodGetData = JSON.parse(prodGetRes.body);
    if (prodGetData?.data?.variants?.length > 0) {
      variantId = prodGetData.data.variants[0].id;
      console.log(`✅ Variant found after creation: ${variantId}`);
    } else {
      console.log('❌ Failed to find variant. Response:', prodGetRes.body.substring(0, 500));
      console.log('Aborting.');
      return;
    }
  }

  // GET cart before add
  console.log('\n--- GET /api/cart (before add) ---');
  const cartBefore = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${cartBefore.status}`);
  const cartBeforeData = JSON.parse(cartBefore.body);

  // POST /cart/add — THE CRITICAL TEST
  console.log(`\n--- POST /api/cart/add variantId=${variantId}, quantity=1 ---`);
  console.log('--- THIS IS THE 500 ERROR TEST ---');
  
  const addRes = await request('POST', '/api/cart/add',
    { variantId, quantity: 1 }, CUST_JWT);
  
  console.log(`Status: ${addRes.status}`);
  let addData;
  try { addData = JSON.parse(addRes.body); } catch(e) {}
  
  if (addRes.status === 200) {
    console.log(`\n✅✅✅ POST /cart/add SUCCEEDED!`);
    console.log(`   Items: ${addData?.data?.itemCount}`);
    if (addData?.data?.items) {
      for (const item of addData.data.items) {
        console.log(`   ${item.productName} x${item.quantity} @ ₹${item.unitPrice} = ₹${item.lineTotal}`);
      }
    }
  } else {
    console.log(`\n❌❌❌ POST /cart/add FAILED`);
    if (addData) {
      console.log(`   Message: ${addData.message}`);
      console.log(`   Full: ${JSON.stringify(addData, null, 2)}`);
    } else {
      console.log(`   Raw: ${addRes.body.substring(0, 2000)}`);
    }
  }

  // GET cart after add
  console.log('\n--- GET /api/cart (after add) ---');
  const cartAfter = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${cartAfter.status}`);
  const cartAfterData = JSON.parse(cartAfter.body);
  console.log(`Items: ${cartAfterData?.data?.itemCount}`);
  if (cartAfter.status === 200) console.log('✅ GET cart works');

  console.log('\n═══════════════════════════════════════════');
  console.log('  CHECK BACKEND TERMINAL FOR DEBUG LOGS!');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);

