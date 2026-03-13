# Doctor Appointment Management System

A full-stack web application built with Node.js, Express, and MongoDB.

## Features
- Patient Registration & Login
- Doctor Listing & Specialization
- Appointment Booking with Time Slot Validation
- Appointment History & Status Tracking
- Admin Dashboard to Manage Doctors
- Beautiful Responsive UI

## How to Run Locally

### Prerequisites
- Node.js installed
- MongoDB (Local or Atlas)

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shalini0410/doctor-appointment-system.git
   cd doctor-appointment-system
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the Backend**:
   ```bash
   node server.js
   ```

5. **Frontend Setup**:
   Simply open `frontend/index.html` in your browser. Alternatively, use a live server extension.

## Connect to GitHub (Shalini0410)
Run these commands in the project root:
```bash
git init
git add .
git commit -m "Initial commit: Doctor Appointment Management System"
git remote add origin https://github.com/Shalini0410/doctor-appointment-system.git
git push -u origin main
```
