# Modern Healthcare Management System 🏥

A comprehensive, full-stack web application designed to seamlessly connect patients and doctors. This system serves as a centralized platform for booking appointments, managing doctor schedules without conflicts, and securely tracking patient medical histories.

Built as a Final-Year Capstone Project, focusing on dynamic role-based workflows and intuitive UI/UX.

---

## 🚀 Key Features

### 👤 For Patients
*   **Intelligent Booking**: Browse available specialists and book time slots easily.
*   **Conflict Prevention**: Real-time validation ensures no double-booking for the same time slot and doctor.
*   **Medical History Tracking**: Access a dedicated "Past Medical History" tab to view permanent, doctor-certified diagnoses and prescribed treatment plans.
*   **Upcoming Alerts**: Clear visual reminders of scheduled appointments.

### 👨‍⚕️ For Doctors
*   **Tailored Dashboards**: A personalized interface displaying only the specific doctor's daily queue and appointments.
*   **Live Queue Counters**: Real-time stats on "Total Appointments", "Patients Seen", and the active "Waiting Room".
*   **Interactive Medical Records**: One-click workflow to mark an appointment as 'Completed' and instantly generate an official medical record (Diagnosis, Treatment, Notes) permanently saved to the patient's history.

---

## 🛠️ Technology Stack
This application follows a robust multi-tier architecture:

*   **Frontend**: HTML5, CSS3 (Custom Glassmorphism styling, CSS Variables, Keyframe Animations), Vanilla JavaScript (ES6+).
*   **Backend API**: Node.js, Express.js (RESTful architecture).
*   **Database**: MongoDB (Mongoose Schema Design) - NoSQL document structure.
*   **Security**: JSON Web Tokens (JWT) for route protection, `bcryptjs` for secure password hashing.

---

## ⚙️ Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Shalini0410/healathcare-tech.git
cd healathcare-tech
```

### 2. Setup the Backend
Open a terminal and navigate to the backend folder:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```
Start the backend server:
```bash
npm start
```
*The server will run on `http://localhost:5000`*

### 3. Run the Frontend
Because the frontend uses vanilla HTML/CSS/JS, you can simply open the `index.html` file in your preferred web browser, or use an extension like VSCode Live Server.

*(Note: The `script.js` uses dynamic logic to fall back to a "Demo Mode" if the backend is unreachable, ensuring the UI can always be presented).*

---
## ✨ Development Focus
- **User Experience Strategy**: Designed with a calm blue-and-white clinical palette, utilizing modern 'Inter' typography and smooth transition animations to minimize cognitive load.
- **Database Modeling**: Careful linkage between `User`, `Doctor`, and `Appointment` schemas to ensure strict data privacy—doctors only access records they are authorized to see.
