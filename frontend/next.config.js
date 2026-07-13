/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `domains` is deprecated in Next 14 — use `remotePatterns` for dynamic
    // host matching. Cloudinary serves optimised product images; Unsplash is the
    // fallback placeholder used in cart/cartStore.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mukhwas.onrender.com',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  },
}

module.exports = nextConfig
