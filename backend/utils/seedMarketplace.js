const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Demo records are labelled in the storefront; never overwrite existing profiles or stock.
module.exports = async function seedMarketplace() {
  const definitions = [
    { email: 'seller@cloudcart.com', name: 'Neighbourhood Essentials', area: 'Kothrud', address: 'Demo shop 01, Sample Market Lane', description: 'Everyday groceries, kitchen essentials and personal care, all in one local stop.', categories: ['Grocery','Home & Kitchen','Beauty & Personal Care'] },
    { email: 'techseller@cloudcart.com', name: 'Corner Tech & Books', area: 'Shivajinagar', address: 'Demo shop 02, Sample High Street', description: 'Explore electronics, reading favourites and useful accessories close to home.', categories: ['Electronics','Books'] },
    { email: 'styleseller@cloudcart.com', name: 'The Local Lifestyle Store', area: 'Baner', address: 'Demo shop 03, Sample Shopping Avenue', description: 'Fashion, sport and fun finds for your family. Reserve online and collect in store.', categories: ['Fashion','Sports & Outdoors','Toys & Games','Other'] },
    { email: 'electronics@cloudcart.com', name: 'Pixel Point Mobiles & Laptops', area: 'Aundh', address: 'Demo shop 04, Sample Electronics Avenue', description: 'A dedicated demo shop for mobile phones and laptops. Compare devices, reserve online and collect from the seller.', categories: [] },
  ];
  const shops = [];
  for (const d of definitions) {
    let owner = await User.findOne({ email: d.email });
    if (!owner) owner = await User.create({ name: d.name, email: d.email, password: process.env.DEMO_SELLER_PASSWORD || 'Seller@1234', role: 'seller' });
    let shop = await Shop.findOne({ owner: owner._id });
    if (!shop) shop = await Shop.create({ owner: owner._id, name: d.name, description: d.description, area: d.area, address: d.address, city: 'Pune', phone: '0000000000', hours: 'Mon–Sat, 9 am–8 pm', isDemo: true });
    shops.push(shop);
    await Product.updateMany({ shop: { $exists: false }, category: { $in: d.categories } }, { $set: { shop: shop._id, createdBy: owner._id } });
  }
  const localProducts = [
    { title: 'Seasonal vegetable basket · 2 kg', description: 'A mixed basket of seasonal vegetables. Ask the seller about today’s selection before collection.', category: 'Grocery', price: 149, stock: 30, image: '/images/vegetables.svg', previousDemoImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600', sku: 'LOCAL-VEG-BASKET', shop: shops[0]._id },
    { title: 'Fresh whole-wheat bread · 400 g', description: 'A soft whole-wheat loaf for your everyday breakfast. Collect during shop hours.', category: 'Grocery', price: 55, stock: 24, image: '/images/bread.svg', previousDemoImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', sku: 'LOCAL-BREAD', shop: shops[0]._id },
    { title: 'Everyday notebook set · Pack of 3', description: 'Three ruled notebooks for school, work and everyday ideas. 160 pages per notebook.', category: 'Books', price: 120, stock: 45, image: '/images/notebook.svg', previousDemoImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', sku: 'LOCAL-NOTEBOOK', shop: shops[1]._id },
    { title: 'Reusable cotton shopping tote', description: 'A lightweight reusable cotton bag for daily neighbourhood shopping. Natural finish.', category: 'Fashion', price: 199, stock: 20, image: '/images/tote.svg', previousDemoImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600', sku: 'LOCAL-TOTE', shop: shops[2]._id },
  ];
  localProducts.push(...require('./electronicsProducts').map(product => ({ ...product, shop: shops[3]._id })));
  for (const product of localProducts) {
    const existing = await Product.findOne({ sku: product.sku });
    if (!existing) await Product.create({ ...product, createdBy: shops.find(s => String(s._id) === String(product.shop)).owner });
    else if (product.sku.startsWith('PIXELPOINT-') && existing.brand === 'Pixel Point Demo' && String(existing.shop) === String(shops[3]._id)) {
      // One-time replacement; preserve IDs, stock, shop ownership and order history.
      await Product.updateOne({ _id: existing._id }, { $set: {
        title: product.title, brand: product.brand, description: product.description,
        image: product.image, price: product.price,
      }, $unset: { discountPrice: 1 } });
    }
    else if (product.previousDemoImage && existing.image === product.previousDemoImage) {
      const changes = { image: product.image };
      if (product.sku.startsWith('PIXELPOINT-') && existing.description.includes('Fictional demo product with an illustrative price and image.')) {
        changes.description = existing.description.replace('Fictional demo product with an illustrative price and image.', 'Fictional demo product with a sample price. The real device photograph is representative and does not verify the listed model or specifications.');
      }
      await Product.updateOne({ _id: existing._id }, { $set: changes });
    }
  }
  console.log('Local marketplace demo shops and listings are ready.');
};
