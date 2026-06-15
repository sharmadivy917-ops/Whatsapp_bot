# 🥬 VegBot Full-Stack E-Commerce System

VegBot is a premium, mobile-first full-stack application built to empower local vegetable vendors. It integrates a fully automated WhatsApp bot with a beautiful, real-time React dashboard for shop owners.

![VegBot Interface](https://img.shields.io/badge/VegBot-v1.0-brightgreen?style=for-the-badge) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## ✨ Features

### 📱 Customer WhatsApp Bot
- **Interactive Ordering:** Customers can order vegetables via simple WhatsApp button and list messages.
- **Automated Pricing:** Calculates real-time sub-totals and final totals.
- **UPI Integration:** Automatically generates deep-linked UPI payment URLs formatted for WhatsApp.
- **Payment Verification:** Allows customers to upload payment screenshots directly to the chat for the owner to verify.
- **Smart Sessions:** Remembers ongoing orders and clears abandoned sessions automatically.

### 💻 Admin Dashboard
- **Mobile-First Experience:** A stunning, premium React interface tailored specifically for mobile browsers using bottom navigation and touch-optimized interactive cards.
- **Real-Time Stats:** Track today's orders, revenue, customer lifetime stats, and pending deliveries.
- **Screenshot Verification:** Securely stream and verify payment screenshots fetched directly from Meta's API without downloading them manually.
- **Catalog Management:** Create, edit, delete, and dynamically toggle the availability of vegetables on the fly.
- **Excel Exports:** Instantly export historical orders and payment histories to `.xlsx` files.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **External APIs:** Meta WhatsApp Cloud API

---

## 🚀 How to Run Locally

### 1. Database Setup
Ensure you have MongoDB running locally or a MongoDB Atlas URI.

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vegbot
JWT_SECRET=your_super_secret_key_change_this_in_production
ADMIN_PASSWORD=admin123
TEST_MODE=false
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the frontend server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. The default login is `admin123`.

---

## 🧪 Testing
The backend features an incredibly robust End-to-End simulation script that verifies the entire WhatsApp API logic, ordering flow, and database math without needing actual WhatsApp API credentials.

To run the test suite:
```bash
cd backend
node test_full.js
```
