// Real device models with matching catalogue photos; prices and stock are demo values.
// Keep original SKUs so carts and order references remain intact.
const devices = [
  { sku: 'PIXELPOINT-PHONE-128', title: 'OPPO F19 Pro+ 5G', brand: 'OPPO', price: 19999, stock: 18, photo: 126 },
  { sku: 'PIXELPOINT-PHONE-256', title: 'Samsung Galaxy S10', brand: 'Samsung', price: 24999, stock: 12, photo: 133 },
  { sku: 'PIXELPOINT-PHONE-PRO', title: 'Apple iPhone 13 Pro', brand: 'Apple', price: 59999, stock: 8, photo: 123 },
  { sku: 'PIXELPOINT-LAPTOP-STUDENT', title: 'Dell XPS 13 9300', brand: 'Dell', price: 74999, stock: 10, photo: 82 },
  { sku: 'PIXELPOINT-LAPTOP-WORK', title: 'ASUS ZenBook Pro Duo', brand: 'ASUS', price: 99999, stock: 8, photo: 79 },
  { sku: 'PIXELPOINT-LAPTOP-CREATOR', title: 'Apple MacBook Pro 14-inch - Space Grey', brand: 'Apple', price: 119999, stock: 5, photo: 78 },
];
module.exports = devices.map(({ photo, ...device }) => ({
  ...device,
  category: 'Electronics',
  description: `${device.title}. Matching product catalogue photograph. Demo listing: price and availability are sample values, not a current retail offer. Confirm configuration and condition with the seller before collection. Reserve online and pay at the shop.`,
  image: `/images/electronics-${photo}.webp`,
}));
