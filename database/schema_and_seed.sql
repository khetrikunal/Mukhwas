-- ============================================================
-- THE ROYAL MUKHWAS — Database Schema & Seed Data
-- PostgreSQL 15+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wholesale_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    gst_number VARCHAR(20),
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_marathi VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    name_marathi VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    description_marathi TEXT,
    ingredients TEXT,
    ingredients_marathi TEXT,
    benefits TEXT,
    benefits_marathi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    weight_grams INT NOT NULL,
    label VARCHAR(50),
    retail_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    moq INT DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_type VARCHAR(20) DEFAULT 'RETAIL',
    status VARCHAR(30) DEFAULT 'PENDING',
    address_id UUID REFERENCES addresses(id),
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    shipping_charge DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(30),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name VARCHAR(200),
    variant_label VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200),
    subtitle TEXT,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ============================================================
-- SEED DATA — Categories (Updated: 6 categories)
-- ============================================================
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Paan', 'paan', 'Premium paan varieties with authentic flavors', 1),
('Sweet Mukhwas', 'sweet-mukhwas', 'Aromatic sweet mouth fresheners for a delightful after-meal experience', 2),
('Chatpata Mukhwas', 'chatpata-mukhwas', 'Tangy and spicy mouth fresheners for those who love a kick', 3),
('Digestive Mukhwas', 'digestive-mukhwas', 'Specially crafted mukhwas to aid digestion naturally', 4),
('Amla Mukhwas', 'amla-mukhwas', 'Vitamin C rich amla-based candies and pachak for health and taste', 5),
('Others', 'others', 'Traditional Indian snacks and delicacies', 6);

-- ============================================================
-- SEED DATA — Admin User
-- Default password: Admin@123 (bcrypt hash below — CHANGE IN PRODUCTION)
-- ============================================================
INSERT INTO users (name, email, phone, password_hash, role, is_verified, is_active) VALUES
('Admin', 'admin@royalmukhwas.com', '9156996309',
 '$2a$10$EblZqNJ9wXqXqXqXqXqXqOeKx0qXqXqXqXqXqXqXqXqXqXqXqXqXq', -- replace with real bcrypt hash
 'ADMIN', true, true);

-- ============================================================
-- SEED DATA — All 16 Products
-- ============================================================
DO $$
DECLARE
    cat_paan UUID;
    cat_sweet UUID;
    cat_chatpata UUID;
    cat_digestive UUID;
    cat_amla UUID;
    cat_others UUID;
    prod_id UUID;
BEGIN
    SELECT id INTO cat_paan FROM categories WHERE slug = 'paan';
    SELECT id INTO cat_sweet FROM categories WHERE slug = 'sweet-mukhwas';
    SELECT id INTO cat_chatpata FROM categories WHERE slug = 'chatpata-mukhwas';
    SELECT id INTO cat_digestive FROM categories WHERE slug = 'digestive-mukhwas';
    SELECT id INTO cat_amla FROM categories WHERE slug = 'amla-mukhwas';
    SELECT id INTO cat_others FROM categories WHERE slug = 'others';

    -- ========== PAAN ==========

    -- 1. Jaipuri Paan
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_paan, 'Jaipuri Paan', 'jaipuri-paan',
            'Authentic Jaipuri paan mukhwas crafted with premium rose petals and aromatic spices. A royal blend that captures the essence of Rajasthani tradition. Hygienically packed to preserve the rich, fragrant taste in every bite.',
            true, true, 'Jaipuri Paan - Premium Paan Mukhwas')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 130.00, 73.50, 10, 500, 'RM-PAAN-JAI-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/paan/jaipuri-paan.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/paan/jaipuri-paan-package.jpeg', false, 1);

    -- 2. Banarasi Paan
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_paan, 'Banarasi Paan', 'banarasi-paan',
            'Classic Banarasi paan mukhwas with the authentic taste of Varanasi. Made with carefully selected betel leaf extract and traditional ingredients. Perfect for a refreshing and indulgent post-meal experience.',
            true, true, 'Banarasi Paan - Classic Paan Mukhwas')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 130.00, 73.50, 10, 500, 'RM-PAAN-BAN-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/paan/banarasi-paan.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/paan/banarasi-paan-package.jpeg', false, 1);

    -- ========== SWEET MUKHWAS ==========

    -- 3. Shimla Mix Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Shimla Mix Mukhwas', 'shimla-mix-mukhwas',
            'A delightful blend of colorful and aromatic seeds inspired by the cool Shimla breeze. This premium mix combines fennel, sesame, and sugar-coated treats for a sweet and refreshing finish. Perfectly balanced for an everyday mouth freshener.',
            true, true, 'Shimla Mix Mukhwas - Sweet Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-SWT-SHM-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/shimla-mix.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/shimla-mix-package.jpeg', false, 1);

    -- 4. Satrangi Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Satrangi Mukhwas', 'satrangi-mukhwas',
            'Seven-colored premium mukhwas featuring a vibrant mix of flavors and textures. Each color brings a unique taste sensation crafted with natural ingredients. A feast for the eyes and a delight for the palate.',
            false, true, 'Satrangi Mukhwas - Colorful Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-SWT-SAT-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/satrangi.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/satrangi-package.jpeg', false, 1);

    -- 5. Khaskhus Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Khaskhus Mukhwas', 'khaskhus-mukhwas',
            'Premium poppy seed mukhwas with a rich, nutty flavor and delicate sweetness. Made with finest quality khaskhus seeds coated in aromatic spices. A traditional delicacy that offers a unique and satisfying crunch.',
            false, true, 'Khaskhus Mukhwas - Poppy Seed Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 130.00, 73.50, 10, 500, 'RM-SWT-KHK-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/khaskhus.jpeg', true, 0);

    -- 6. Chandan Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Chandan Mukhwas', 'chandan-mukhwas',
            'Aromatic sandalwood-infused mukhwas that delivers a cooling and refreshing after-meal experience. Crafted with natural chandan essence and premium fennel seeds. Elegantly flavored for those who appreciate subtle sophistication.',
            true, true, 'Chandan Mukhwas - Sandalwood Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-SWT-CHD-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/chandan.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/chandan-package.jpeg', false, 1);

    -- 7. Bambaiya Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Bambaiya Mukhwas', 'bambaiya-mukhwas',
            'Mumbai-style premium mukhwas with a bold and vibrant flavor profile. This signature blend combines traditional spices with a modern twist. Perfect for those who enjoy the bustling flavors of the city of dreams.',
            false, true, 'Bambaiya Mukhwas - Mumbai Style Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-SWT-BAM-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/bambaiya.jpeg', true, 0);

    -- 8. Madbasi Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_sweet, 'Madbasi Mukhwas', 'madbasi-mukhwas',
            'South Indian inspired mukhwas with a distinctive taste of curry leaves and coconut. A unique blend that brings the flavors of the South to your palate. Lightly sweetened and wonderfully aromatic after every meal.',
            false, true, 'Madbasi Mukhwas - South Indian Style Mouth Freshener')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 90.00, 42.00, 10, 500, 'RM-SWT-MAD-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/sweet-mukhwas/madbasi.jpeg', true, 0);

    -- ========== CHATPATA MUKHWAS ==========

    -- 9. Tilchi Feri
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_chatpata, 'Tilchi Feri', 'tilchi-feri',
            'Tangy and spicy sesame-based mukhwas with a bold chatpata flavor. Made with roasted til seeds, raw mango powder, and select spices. A zesty treat for those who crave a punch of flavor after every meal.',
            false, true, 'Tilchi Feri - Chatpata Sesame Mukhwas')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-CHP-TLF-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/chatpata-mukhwas/tilchi-feri.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/chatpata-mukhwas/tilchi-feri-package.jpeg', false, 1);

    -- ========== DIGESTIVE MUKHWAS ==========

    -- 10. Digestive Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_digestive, 'Digestive Mukhwas', 'digestive-mukhwas',
            'A specially formulated digestive mukhwas blend with ajwain, jeera, and black salt. Designed to promote healthy digestion naturally after every meal. Hygienically packed with a perfect balance of taste and wellness.',
            true, true, 'Digestive Mukhwas - Natural Digestive Aid')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 130.00, 73.50, 10, 500, 'RM-DIG-DGM-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/digestive-mukhwas/digestive-mukhwas.jpeg', true, 0);

    -- ========== AMLA MUKHWAS ==========

    -- 11. Honey Amla Candy
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_amla, 'Honey Amla Candy', 'honey-amla-candy',
            'Delicious honey-coated amla candy rich in natural Vitamin C and antioxidants. Made from premium Indian gooseberries with pure honey glaze. A healthy and tasty treat that boosts immunity with every bite.',
            true, true, 'Honey Amla Candy - Vitamin C Rich Treat')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-AML-HON-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/honey-amla-candy.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/honey-amla-candy-package.jpeg', false, 1);

    -- 12. Jeera Amla Candy
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_amla, 'Jeera Amla Candy', 'jeera-amla-candy',
            'Tangy amla candy infused with roasted cumin for a bold digestive punch. Combines the immunity-boosting power of amla with the digestive benefits of jeera. A perfect balance of sour, spicy, and savory in every piece.',
            false, true, 'Jeera Amla Candy - Cumin Amla Digestive')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-AML-JRA-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/jeera-amla-candy.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/jeera-amla-candy-package.jpeg', false, 1);

    -- 13. Amla Pachak
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_amla, 'Amla Pachak', 'amla-pachak',
            'Traditional amla pachak made with sun-dried amla and authentic Indian spices. A time-tested digestive remedy that aids gut health and freshens breath. Naturally tangy with a hint of sweetness for everyday enjoyment.',
            false, true, 'Amla Pachak - Traditional Digestive')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-AML-PCH-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/amla-pachak.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/amla-mukhwas/amla-pachak-package.jpeg', false, 1);

    -- ========== OTHERS ==========

    -- 14. Aam Papad
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_others, 'Aam Papad', 'aam-papad',
            'Authentic sun-dried aam papad made from ripe Alphonso mangoes and a touch of spice. A beloved Indian treat with the perfect blend of sweet and tangy flavors. Handcrafted using traditional methods for that homemade taste.',
            false, true, 'Aam Papad - Traditional Mango Treat')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 140.00, 84.00, 10, 500, 'RM-OTH-AAM-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/others/aam-papad.jpeg', true, 0);

    -- 15. Imli Laddu
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_others, 'Imli Laddu', 'imli-laddu',
            'Soft and tangy tamarind laddus made with premium imli and jaggery. A nostalgic treat that brings back childhood memories with every bite. Perfectly balanced sweet-sour flavor with natural ingredients.',
            false, true, 'Imli Laddu - Tamarind Sweet Balls')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-OTH-IML-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/others/imli-laddu.jpeg', true, 0);
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/others/imli-laddu-2.jpeg', false, 1);

    -- 16. Mango Slice Mukhwas
    INSERT INTO products (category_id, name, slug, description, is_featured, is_active, meta_title)
    VALUES (cat_others, 'Mango Slice Mukhwas', 'mango-slice-mukhwas',
            'Crispy dried mango slices coated with tangy masala for an irresistible snacking experience. Made from premium raw mangoes with a spicy-sweet twist. A crunchy, flavorful treat perfect for any time of the day.',
            false, true, 'Mango Slice Mukhwas - Spicy Mango Treat')
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, weight_grams, label, retail_price, wholesale_price, moq, stock_quantity, sku)
    VALUES (prod_id, 100, '100 gm', 120.00, 63.00, 10, 500, 'RM-OTH-MNG-100');
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
    VALUES (prod_id, '/products/others/mango-slice.jpeg', true, 0);

END $$;

-- ============================================================
-- SEED DATA — Sample Coupon
-- ============================================================
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, is_active)
VALUES ('WELCOME10', 'PERCENTAGE', 10, 300, 100, 1000, true);

-- ============================================================
-- NOTE:
-- This seed file covers schema + all 16 products across 6 categories.
-- Use the admin panel to manage products going forward.
-- ============================================================
