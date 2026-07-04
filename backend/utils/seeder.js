const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const connectDB = require('../config/db');

const sampleProducts = [
  {
    title: 'Apple iPhone 15 Pro (256GB, Natural Titanium)',
    description:
      'Experience the power of Apple Intelligence on iPhone 15 Pro. Features the A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500',
    category: 'Electronics',
    brand: 'Apple',
    price: 134900,
    discountPrice: 129900,
    stock: 50,
    sku: 'APPL-IP15P-256-NT',
  },
  {
    title: 'Samsung Galaxy S24 Ultra (12GB/256GB)',
    description:
      'Galaxy AI is here. Samsung Galaxy S24 Ultra features the most powerful processor ever in a Galaxy phone, a built-in S Pen, and pro-grade camera capabilities.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
    category: 'Electronics',
    brand: 'Samsung',
    price: 129999,
    discountPrice: 119999,
    stock: 35,
    sku: 'SAMS-S24U-12-256',
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description:
      'Industry-leading noise cancellation with two processors and eight microphones. Up to 30-hour battery life, multipoint connection, and speak-to-chat technology.',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500',
    category: 'Electronics',
    brand: 'Sony',
    price: 29990,
    discountPrice: 24990,
    stock: 80,
    sku: 'SONY-WH1000XM5-BLK',
  },
  {
    title: 'Apple MacBook Air M2 (8GB/256GB, Midnight)',
    description:
      'Supercharged by the next-generation M2 chip, the redesigned MacBook Air is more portable than ever. Featuring a 13.6-inch Liquid Retina display and MagSafe charging.',
    image: 'https://images.unsplash.com/photo-1611186871525-83f2b8e8c61b?w=500',
    category: 'Electronics',
    brand: 'Apple',
    price: 114900,
    discountPrice: 109900,
    stock: 25,
    sku: 'APPL-MBA-M2-8-256-MN',
  },
  {
    title: 'Nike Air Max 270 Running Shoes',
    description:
      'The Nike Air Max 270 delivers unrivalled, all-day comfort. The shoe features Nike\'s biggest heel Air unit yet for a super-soft ride that feels as impossible as it looks.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    category: 'Fashion',
    brand: 'Nike',
    price: 12995,
    discountPrice: 9999,
    stock: 120,
    sku: 'NIKE-AM270-WHT-10',
  },
  {
    title: 'Levi\'s 511 Slim Fit Men\'s Jeans',
    description:
      'The 511 Slim Fit Jean sits below the waist with a slim fit through the thigh and leg opening. Made with advanced stretch technology for all-day comfort.',
    image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500',
    category: 'Fashion',
    brand: "Levi's",
    price: 3999,
    discountPrice: 2999,
    stock: 200,
    sku: "LEVI-511-SLIM-32-32",
  },
  {
    title: 'Prestige Iris 750W Mixer Grinder (3 Jars)',
    description:
      'The Prestige Iris 750W Mixer Grinder comes with 3 stainless steel jars for grinding, mixing, and juicing. Features a powerful 750W motor with speed control.',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500',
    category: 'Home & Kitchen',
    brand: 'Prestige',
    price: 3499,
    discountPrice: 2799,
    stock: 60,
    sku: 'PRES-IRIS-750W-3J',
  },
  {
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker (6 Qt)',
    description:
      'The Instant Pot Duo is the world\'s best-selling multi-cooker. It replaces 7 kitchen appliances: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    category: 'Home & Kitchen',
    brand: 'Instant Pot',
    price: 8999,
    discountPrice: 6999,
    stock: 45,
    sku: 'IP-DUO-7IN1-6QT',
  },
  {
    title: 'Atomic Habits by James Clear',
    description:
      'No.1 New York Times bestseller. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies to help you form good habits and break bad ones.',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    category: 'Books',
    brand: 'Penguin Random House',
    price: 799,
    discountPrice: 499,
    stock: 300,
    sku: 'BOOK-ATOM-HABITS-PB',
  },
  {
    title: 'Mamaearth Vitamin C Face Serum (30ml)',
    description:
      'Mamaearth Vitamin C Face Serum with Vitamin C and Turmeric for Skin Illumination. Reduces dark spots and pigmentation, brightens and evens skin tone.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
    category: 'Beauty & Personal Care',
    brand: 'Mamaearth',
    price: 599,
    discountPrice: 449,
    stock: 150,
    sku: 'MAMA-VITC-SER-30ML',
  },
  {
    title: 'Decathlon Kipsta FC500 Football',
    description:
      'Official size and weight football. Durable 4-ply casing. Machine-stitched for consistency. Suitable for training on firm ground. Age 13 and above.',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=500',
    category: 'Sports & Outdoors',
    brand: 'Decathlon',
    price: 899,
    discountPrice: 699,
    stock: 90,
    sku: 'DEC-FC500-FB-5',
  },
  {
    title: 'LEGO Classic Creative Bricks Set (900 Pieces)',
    description:
      'This LEGO Classic Creative Bricks box is packed with 900 bricks in 33 different colors. The perfect starting point for any budding LEGO builder aged 4 and above.',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500',
    category: 'Toys & Games',
    brand: 'LEGO',
    price: 2999,
    discountPrice: 2499,
    stock: 70,
    sku: 'LEGO-CLASSIC-900PC',
  },
];

const seedDB = async () => {
  await connectDB();

  if (process.argv[2] === '--destroy') {
    console.log('Destroying all data...');
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Cart.deleteMany(),
      Order.deleteMany(),
    ]);
    console.log('All data destroyed.');
    process.exit(0);
  }

  console.log('Seeding database...');


  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    await User.create({
      name: process.env.ADMIN_NAME || 'CloudCart Admin',
      email: process.env.ADMIN_EMAIL || 'admin@cloudcart.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
    });
    console.log('Admin user created.');
  } else {
    console.log('Admin user already exists, skipping.');
  }


  const existingCount = await Product.countDocuments();
  if (existingCount === 0) {
    await Product.insertMany(sampleProducts);
    console.log(`${sampleProducts.length} products seeded.`);
  } else {
    console.log(`${existingCount} products already exist, skipping product seed.`);
  }

  console.log('Database seeded successfully!');
  process.exit(0);
};

seedDB().catch((err) => {
  console.error('Seeder error:', err.message);
  process.exit(1);
});
