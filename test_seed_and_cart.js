/**
 * Seed database and test cart add.
 * Run: node test_seed_and_cart.js
 */
const http = require('http');

let JWT = null;

function request(method, path, data, token) {
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
  // Step 1: Login as admin
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'admin@royalmukhwas.com',
    password: 'Admin@123',
  });
  const loginData = JSON.parse(loginRes.body);
  JWT = loginData.data.accessToken;
  console.log('✅ Logged in as admin');

  // Step 2: Register a test customer
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    password: 'Test@123',
  });
  console.log(`Register customer: ${registerRes.status}`);
  
  // Also login as customer to get JWT
  const custLogin = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'Test@123',
  });
  const custData = JSON.parse(custLogin.body);
  let CUST_JWT = null;
  if (custData.data?.accessToken) {
    CUST_JWT = custData.data.accessToken;
    console.log('✅ Logged in as customer');
  }

  // Step 3: Create a category for the product
  // NOTE: The admin category create is at POST /api/categories (not /api/admin/categories)
  const catRes = await request('POST', '/api/categories', {
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test category for testing',
  }, JWT);
  console.log(`Create category: ${catRes.status}`);
  let catData;
  try { catData = JSON.parse(catRes.body); } catch(e) {}
  let catId = catData?.data?.id || null;
  console.log(`Category ID: ${catId}`);

  // Step 4: Create a product
  // The admin product controller takes Map<String, Object> and expects 'category' as an object with 'id'
  const prodRes = await request('POST', '/api/admin/products', {
    name: 'Test Product',
    nameMarathi: null,
    slug: 'test-product',
    description: 'Test product for cart testing',
    descriptionMarathi: null,
    ingredients: null,
    ingredientsMarathi: null,
    benefits: null,
    benefitsMarathi: null,
    isActive: true,
    isFeatured: false,
    metaTitle: null,
    metaDescription: null,
    category: { id: catId },
    variants: [
      {
        weightGrams: 100,
        label: '100 gm',
        retailPrice: 100.00,
        wholesalePrice: 70.00,
        moq: 10,
        stockQuantity: 500,
        sku: 'TEST-100',
        isActive: true,
      },
    ],
  }, JWT);
  console.log(`Create product: ${prodRes.status}`);
  console.log(prodRes.body.substring(0, 1000));
  let prodData;
  try { prodData = JSON.parse(prodRes.body); } catch(e) {}

  // Get variant ID from the created product
  let variantId = null;
  if (prodData?.data?.variants && prodData.data.variants.length > 0) {
    variantId = prodData.data.variants[0].id;
    console.log(`\n✅ Created product with variant: ${variantId}`);
  } else if (prodData?.data) {
    console.log('Product created, checking structure:', Object.keys(prodData.data));
    console.log('Variants:', JSON.stringify(prodData.data.variants));
  }

  if (!variantId) {
    console.log('❌ Could not get variant ID. Fetching admin products...');
    const listRes = await request('GET', '/api/admin/products?page=0&size=10', null, JWT);
    console.log(listRes.body.substring(0, 2000));
    const listData = JSON.parse(listRes.body);
    if (listData?.data?.content?.[0]?.variants?.[0]?.id) {
      variantId = listData.data.content[0].variants[0].id;
      console.log(`Found variant: ${variantId}`);
    } else {
      console.log('Still cannot find variant. Aborting.');
      return;
    }
  }

  // Step 5: GET cart as customer
  console.log(`\n--- GET /api/cart as customer ---`);
  const cartRes = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${cartRes.status}`);
  try {
    const cartData = JSON.parse(cartRes.body);
    console.log(`Items: ${cartData.data?.itemCount ?? cartData.data?.items?.length ?? 0}`);
    if (cartRes.status === 200) console.log('✅ GET cart succeeded');
  } catch(e) {}

  // Step 6: POST /cart/add as customer — THE CRITICAL TEST
  console.log(`\n--- POST /api/cart/add variantId=${variantId}, quantity=1 ---`);
  console.log('--- THIS IS THE TEST THAT CAUSES THE 500 ERROR ---');
  
  const addRes = await request('POST', '/api/cart/add', {
    variantId: variantId,
    quantity: 1,
  }, CUST_JWT);
  
  console.log(`Status: ${addRes.status}`);
  
  try {
    const addData = JSON.parse(addRes.body);
    console.log(`Response: success=${addData.success}, message=${addData.message}`);
    
    if (addRes.status === 200) {
      console.log(`\n✅ POST /cart/add SUCCEEDED!`);
      console.log(`   Item count: ${addData.data?.itemCount}`);
      if (addData.data?.items) {
        for (const item of addData.data.items) {
          console.log(`   ${item.productName} x${item.quantity} = ₹${item.lineTotal}`);
        }
      }
    } else {
      console.log(`\n❌ POST /cart/add FAILED with ${addRes.status}`);
      console.log(`   ${addData.message}`);
      console.log(`   Full:`, JSON.stringify(addData, null, 2));
    }
  } catch(e) {
    console.log(`Raw body: ${addRes.body}`);
  }

  // Step 7: Verify GET /cart still works
  console.log(`\n--- GET /api/cart after add attempt ---`);
  const finalCartRes = await request('GET', '/api/cart', null, CUST_JWT);
  console.log(`Status: ${finalCartRes.status}`);
  try {
    const finalData = JSON.parse(finalCartRes.body);
    if (finalCartRes.status === 200) console.log(`✅ GET cart works. Items: ${finalData.data?.itemCount}`);
  } catch(e) {}

  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);

