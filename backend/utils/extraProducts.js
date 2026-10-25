// Fictional demo listings; prices and stock are sample data.
const listings = [
  ['Wireless Over-Ear Headphones', 'Electronics', 3499, 2799, 45, 'photo-1618366712010-f4ae9c647dcb', 'Soft ear cushions, wireless listening, and a foldable design for your everyday commute.'],
  ['Everyday Laptop 14-inch', 'Electronics', 42999, 38999, 18, 'photo-1611186871525-83f2b8e8c61b', 'A lightweight laptop for study, presentations, and everyday office tasks.'],
  ['Compact Smartphone 128GB', 'Electronics', 15999, 13999, 35, 'photo-1610945265064-0e34e5519bbf', 'A compact everyday smartphone with ample space for photos, apps, and music.'],
  ['Canvas Everyday Sneakers', 'Fashion', 1999, 1499, 65, 'photo-1542291026-7eec264c27ff', 'Comfortable lace-up sneakers with a versatile design for casual outings.'],
  ['Classic Straight-Fit Jeans', 'Fashion', 2499, 1899, 50, 'photo-1542272454315-4c01d7abdf4a', 'Everyday denim with a straight fit, five pockets, and a comfortable waistband.'],
  ['City Travel Backpack', 'Fashion', 2299, 1799, 40, 'photo-1553062407-98eeb64c6a62', 'A practical daypack with organized compartments for commuting, college, and short trips.'],
  ['Ceramic Coffee Mug Set', 'Home & Kitchen', 1299, 999, 60, 'photo-1514228742587-6b1558fcca3d', 'A set of four ceramic mugs for relaxed mornings and coffee with friends.'],
  ['Pour-Over Coffee Kit', 'Home & Kitchen', 2199, 1699, 28, 'photo-1495474472287-4d71bcdd2085', 'A simple brewing kit for preparing and serving your daily pour-over coffee.'],
  ['Indoor Planter Set', 'Home & Kitchen', 1599, 1199, 42, 'photo-1485955900006-10f4d324d411', 'Decorative planters to bring a touch of greenery to desks and windowsills.'],
  ['The Everyday Reading Collection', 'Books', 1199, 899, 80, 'photo-1544947950-fa07a98d237f', 'A demo collection of short stories for a relaxed weekend of reading.'],
  ['Creative Journal and Notebook Set', 'Books', 699, 499, 95, 'photo-1455390582262-044cdead277a', 'A set of notebooks for daily reflections, study notes, and creative ideas.'],
  ['Daily Skincare Gift Set', 'Beauty & Personal Care', 1799, 1399, 36, 'photo-1620916566398-39f1143ab7be', 'A gift-ready assortment of everyday skincare essentials for your daily routine.'],
  ['Gentle Hand Care Set', 'Beauty & Personal Care', 899, 649, 55, 'photo-1608571423902-eed4a5ad8108', 'A compact hand-care gift set for home, travel, or your office desk.'],
  ['Training Football Size 5', 'Sports & Outdoors', 1299, 999, 48, 'photo-1575361204480-aadea25e6e68', 'A practice football for friendly matches and regular outdoor training.'],
  ['Cushioned Exercise Mat', 'Sports & Outdoors', 1599, 1199, 32, 'photo-1544367567-0f2fcb009e0b', 'A cushioned, rollable exercise mat for stretching and home workouts.'],
  ['Creative Building Blocks Set', 'Toys & Games', 1899, 1499, 44, 'photo-1587654780291-39c9404d746b', 'Colourful building pieces for imaginative play and family construction challenges.'],
  ['Roasted Coffee Beans 500g', 'Grocery', 899, 749, 75, 'photo-1447933601403-0c6688de566e', 'A demo pack of roasted coffee beans for your favourite home brewing method.'],
  ['Breakfast Oats 1kg', 'Grocery', 399, 329, 100, 'photo-1517673132405-a56a62b18caf', 'Versatile breakfast oats for warm porridge, overnight oats, and baking.'],
];

module.exports = listings.map(([title, category, price, discountPrice, stock, photo, description], index) => ({
  title,
  category,
  price,
  discountPrice,
  stock,
  description,
  brand: 'CloudCart Essentials',
  sku: `CC-DEMO-${String(index + 1).padStart(3, '0')}`,
  image: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&q=80`,
}));
