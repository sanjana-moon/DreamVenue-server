# 🏛️ DreamVenue Server

The **DreamVenue Server** is the backend API for DreamVenue, a venue marketplace platform that connects customers with venue vendors.

It provides RESTful APIs for authentication, user management, venue management, bookings, payments, and role-based access control.

## 🔗 Related Project

🌐 **Frontend:** https://dreamvenue.vercel.app

## ✨ Features

* 🔐 Authentication and authorization
* 👥 Role-based access control
* 🏛️ Venue creation and management
* 🔎 Venue search and filtering
* 📅 Booking management
* 💳 Stripe payment integration
* 👤 Customer and vendor profile management
* 🛡️ Admin management APIs
* 🔄 RESTful API architecture
* 🗄️ MongoDB database integration
* ⚡ Secure and scalable server-side architecture

## 👥 User Roles

### 👤 Customer

* Browse venues
* View venue details
* Create bookings
* Make payments
* Manage bookings
* Manage profile

### 🏢 Vendor

* Create and manage venues
* Update venue information
* Manage bookings
* Manage vendor profile

### 🛡️ Admin

* Manage users
* Manage vendors
* Manage venues
* Monitor platform activities

## 🧰 Tech Stack

### Backend

* **Node.js**
* **Express.js**
* **TypeScript**
* **MongoDB**
* **REST API**

### Authentication & Payments

* **Better Auth**
* **JWT**
* **Stripe**

### Development Tools

* **Git & GitHub**
* **Postman**
* **npm**

## 📁 Project Structure

```text
dreamvenue-server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   ├── models/
│   ├── config/
│   ├── utils/
│   ├── types/
│   └── app.ts
├── public/
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git
* MongoDB

### Installation

Clone the repository:

```bash
git clone https://github.com/DreamVenue/DreamVenue-server.git
```

Navigate to the project directory:

```bash
cd DreamVenue-server
```

Install dependencies:

```bash
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the root directory and configure the required environment variables:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

STRIPE_SECRET_KEY=your_stripe_secret_key

CLIENT_URL=your_frontend_url
```

Add any additional environment variables required by your local configuration.

## ▶️ Run the Server

### Development

```bash
npm run dev
```

### Production

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The API will be available at:

```text
http://localhost:5000
```

## 🔄 API Architecture

```text
Client
  │
  ▼
Express Server
  │
  ├── Authentication
  │
  ├── Authorization
  │
  ├── Request Validation
  │
  ├── Controllers
  │
  ├── Services
  │
  └── Database
          │
          ▼
       MongoDB
```

For payment-related operations:

```text
Client
  │
  ▼
Backend API
  │
  ▼
Stripe
  │
  ▼
Payment Confirmation
  │
  ▼
Booking Status Update
```

## 🔑 Authentication & Authorization

The server uses authentication and role-based authorization to protect sensitive resources.

Different permissions are provided based on the user's role:

```text
Customer → Customer resources
Vendor   → Vendor resources
Admin    → Administrative resources
```

Protected routes verify the authenticated user before allowing access to restricted operations.

## 🏛️ Venue Management

The API provides endpoints for managing venue data, including:

* Create venue
* Get venues
* Get venue details
* Update venue
* Delete venue
* Search and filter venues

## 📅 Booking Management

The booking system handles:

* Creating bookings
* Checking booking information
* Managing booking status
* Vendor booking management
* Customer booking history

## 💳 Stripe Integration

DreamVenue uses **Stripe** to process online payments securely.

The backend handles payment-related operations and updates booking information after successful payment processing.

> Stripe secret keys and other sensitive credentials are stored in environment variables and are never exposed to the client.

## 🛡️ Security

The server follows several security practices, including:

* Environment-based secret management
* Protected API routes
* Authentication middleware
* Role-based authorization
* Server-side payment processing
* Input validation
* Restricted access to administrative operations

## 🧪 API Testing

API endpoints can be tested using **Postman** or another API testing client.

Example:

```text
GET    /api/venues
GET    /api/venues/:id
POST   /api/venues
PATCH  /api/venues/:id
DELETE /api/venues/:id

POST   /api/bookings
GET    /api/bookings
PATCH  /api/bookings/:id

POST   /api/payments
```

*The exact routes may vary depending on the current server implementation.*

## 🌐 Deployment

The server can be deployed to platforms such as:

* Vercel
* Render
* Railway
* Other Node.js-compatible hosting platforms

Environment variables must be configured in the deployment environment before running the production server.

## 🔮 Future Improvements

* Real-time booking availability
* Advanced caching
* Improved API validation
* Automated testing
* Rate limiting
* Centralized error handling
* API documentation with Swagger
* More advanced vendor analytics

## 👩‍💻 Developer

**Sanjana Moon**

* 🌐 Portfolio: https://sanjana-portfolio-eight-eta.vercel.app
* 💻 GitHub: https://github.com/sanjana-moon
* 💼 LinkedIn: https://linkedin.com/in/sanjana-moon

---

⭐ If you find this project useful, consider giving the repository a star!
