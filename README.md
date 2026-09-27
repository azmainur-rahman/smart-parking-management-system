# Smart Parking Management System

A full-stack web platform for booking secure parking spaces by hour or day. Built with vanilla HTML/CSS/JS frontend and Node.js/Express backend.

## Features

- 🅿️ Real-time parking slot availability
- 🚗 Vehicle management (cars, motorcycles, SUVs)
- 💳 Mock payment flow (SSLCommerz-ready)
- 📱 Fully responsive editorial landing page
- 🔐 JWT-based authentication with role-based access (Customer/Manager/Admin)

## Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript  
**Backend:** Node.js, Express.js, MongoDB, Mongoose  
**Payment:** SSLCommerz (mock mode for testing)  
**Database:** MongoDB Atlas

## Project Structure

smart-parking-management-system/
├── frontend/ # Static landing page + future app
├── backend/ # Node.js API server
└── README.md



## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend

Open `frontend/index.html` in your browser, or use Live Server extension.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your real credentials.

## License

MIT