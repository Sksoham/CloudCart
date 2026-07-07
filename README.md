# CloudCart — Full Stack E-Commerce on AWS Cloud

A production-ready, multi-tier e-commerce web application built with the MERN stack and deployed on AWS Cloud infrastructure with automated CI/CD via GitHub Actions.

[![CI/CD Pipeline](https://github.com/your-username/cloudcart/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/cloudcart/actions)
![Node](https://img.shields.io/badge/Node.js-20+-339933)
![React](https://img.shields.io/badge/React-18-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3%20%7C%20CloudFront-FF9900)

---

## Project Description

**CloudCart** is a cloud-native full-stack e-commerce platform demonstrating real-world software engineering and AWS cloud architecture skills. It includes a complete shopping experience: product browsing, cart management, order placement, JWT authentication, and an admin panel — all deployed on AWS with CI/CD.

---

## Features

### Authentication
- Register / Login / Logout with JWT
- HttpOnly cookie + localStorage token dual strategy
- Role-based access control (user / admin)
- Password change with current password verification
- Protected React routes with role guards

### Products
- Browse with full-text keyword search (MongoDB text index)
- Filter by category, min/max price, sort by newest/price/rating
- Product detail with star reviews
- Pagination

### Cart
- Add / remove / update quantity
- Live stock validation
- Free shipping threshold (orders over INR 499)
- Cart badge with item count

### Orders
- Checkout with shipping address form
- COD / UPI / Card payment methods
- Price: items + shipping + 18% GST
- 4-step visual order progress tracker
- Stock deducted on order, restocked on cancellation

### Admin Panel
- Dashboard: revenue stats, order counts, fulfillment bars
- Product CRUD with image URL preview and soft delete
- Inline order/payment status updates
- User management: role toggle, activate/deactivate, delete

### UI/UX
- Dark mode (OS preference + manual toggle)
- Fully responsive (mobile-first)
- Toast notifications
- Loading spinners and pre-React splash screen
- Custom 404 page

---

## Architecture

```
GitHub Repo
    |
    v
GitHub Actions CI/CD
    |           |
    v           v
AWS S3      AWS EC2
(React)   (Node.js API)
    |           |
    v           |
CloudFront      |
(CDN/HTTPS)     |
                v
          MongoDB Atlas
```

| Tier | Technology | Hosting |
|------|-----------|---------|
| Presentation | React 18 + Tailwind CSS | AWS S3 + CloudFront |
| Application | Node.js + Express REST API | AWS EC2 + PM2 |
| Data | MongoDB Atlas (Mongoose) | MongoDB Cloud |
| CI/CD | GitHub Actions | GitHub |

---

## Folder Structure

```
CloudCart/
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── backend/
│   ├── config/db.js               # MongoDB Atlas connection
│   ├── controllers/               # authController, userController, productController, cartController, orderController
│   ├── middleware/                # authMiddleware, errorHandler, validateRequest
│   ├── models/                    # User, Product, Cart, Order
│   ├── routes/                    # authRoutes, userRoutes, productRoutes, cartRoutes, orderRoutes
│   ├── utils/                     # generateToken, seeder
│   ├── server.js                  # Express entry point
│   └── .env.example
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── components/            # Navbar, Footer, Loader, ProductCard, StarRating, Pagination
│   │   ├── context/               # AuthContext, CartContext, ThemeContext
│   │   ├── pages/                 # Home, Products, ProductDetail, Cart, Checkout, Orders, OrderDetail, Login, Register, Profile, NotFound
│   │   ├── pages/admin/           # Dashboard, AdminProducts, AdminProductForm, AdminOrders, AdminUsers
│   │   ├── services/              # api.js (Axios), index.js (all service modules)
│   │   ├── App.jsx                # Route tree with guards
│   │   └── index.css              # Tailwind layers + component classes
│   ├── tailwind.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Database Models

**User:** name, email, password (bcrypt), role, phone, address, isActive

**Product:** title, description, image, category, brand, price, discountPrice, stock, sku, ratings, reviews[], isActive

**Cart:** user, items[{ product, title, image, price, quantity }], virtuals: totalItems, totalPrice

**Order:** user, items[], shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice, paymentStatus, orderStatus, timestamps

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/logout | Private | Logout |
| GET | /api/auth/me | Private | Current user |
| GET | /api/products | Public | List/search/filter products |
| GET | /api/products/:id | Public | Product detail |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |
| GET | /api/cart | Private | Get cart |
| POST | /api/cart | Private | Add to cart |
| PUT | /api/cart/:id | Private | Update quantity |
| DELETE | /api/cart/:id | Private | Remove item |
| POST | /api/orders | Private | Place order |
| GET | /api/orders/my-orders | Private | My orders |
| GET | /api/orders | Admin | All orders |
| PUT | /api/orders/:id/status | Admin | Update status |
| GET | /api/orders/stats | Admin | Dashboard stats |
| GET | /api/users | Admin | All users |
| PUT | /api/users/:id | Admin | Update user |

---

## Installation

### Prerequisites
- Node.js >= 18, npm >= 9
- MongoDB Atlas account
- AWS account (for deployment)

### Clone & Install
```bash
git clone https://github.com/your-username/cloudcart.git
cd cloudcart

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

## Environment Variables

### backend/.env
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/cloudcart
JWT_SECRET=your_super_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@cloudcart.com
ADMIN_PASSWORD=Admin@1234
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## Running Locally

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env    # fill in real values
npm run dev             # http://localhost:5000

# Terminal 2 — Frontend
cd frontend
cp .env.example .env    # fill in real values
npm start               # http://localhost:3000
```

---

## Seeding the Database

```bash
cd backend
node utils/seeder.js           # seeds admin + 12 products
node utils/seeder.js --destroy # wipe all data
```

**Demo admin:** admin@cloudcart.com / Admin@1234

---

## AWS Deployment

### Frontend (S3 + CloudFront)

1. Create S3 bucket, enable static website hosting
2. Build: `REACT_APP_API_URL=http://<ec2-ip>:5000 npm run build`
3. Upload: `aws s3 sync build/ s3://your-bucket --delete`
4. Create CloudFront distribution pointing to S3
5. Add custom error page: 404 → /index.html (200) for SPA routing

### Backend (EC2)

```bash
# On EC2 (Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

git clone https://github.com/your-username/cloudcart.git
cd cloudcart/backend
cp .env.example .env && nano .env  # set production values

pm2 start server.js --name cloudcart-api
pm2 startup && pm2 save
```

**EC2 Security Group:** Allow port 22 (SSH) and 5000 (API)

---

## CI/CD Pipeline

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **test** — Jest tests against in-workflow MongoDB
2. **build** — `npm run build` (React production bundle)
3. **deploy-frontend** — `aws s3 sync` + CloudFront invalidation
4. **deploy-backend** — SSH → git pull → npm ci → pm2 reload

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| AWS_ACCESS_KEY_ID | IAM user access key |
| AWS_SECRET_ACCESS_KEY | IAM user secret |
| AWS_REGION | e.g. ap-south-1 |
| S3_BUCKET_NAME | Your S3 bucket name |
| CLOUDFRONT_DISTRIBUTION_ID | CloudFront ID |
| EC2_HOST | EC2 public IP |
| EC2_USER | ubuntu (or ec2-user) |
| EC2_SSH_KEY | Full PEM key content |
| REACT_APP_API_URL | http://your-ec2-ip:5000 |

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| EC2 | Node.js/Express API hosting |
| S3 | React static file hosting |
| CloudFront | CDN, HTTPS, global edge cache |
| IAM | CI/CD deployment permissions |
| MongoDB Atlas | Cloud database (non-AWS) |

---


## Future Improvements

- [ ] Stripe / Razorpay real payment integration
- [ ] AWS Lambda for serverless image resize
- [ ] AWS SES for transactional emails
- [ ] AWS ElastiCache (Redis) for session caching
- [ ] AWS CloudWatch for centralised logging
- [ ] Elasticsearch / OpenSearch for advanced search
- [ ] Multi-image product gallery (S3 pre-signed URLs)
- [ ] Wishlist feature
- [ ] Coupon / discount code system
- [ ] WebSocket real-time order notifications
- [ ] Terraform IaC for reproducible AWS setup
- [ ] Docker + ECS containerised deployment
- [ ] Full Jest + Supertest test coverage

---

## License

MIT License — see LICENSE for details.

> Built as a cloud computing internship portfolio project demonstrating full-stack development, REST API design, React architecture, AWS deployment, and DevOps automation.
