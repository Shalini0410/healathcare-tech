const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://doctor-appointment-backend.onrender.com/api';
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentToken = localStorage.getItem('token');
let selectedDoctorId = null;

// Auth UI Toggle
function toggleAuth(type) {
    document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = type === 'register' ? 'block' : 'none';
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? 'var(--success)' : 'var(--error)';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Registration successful! Please login.');
            toggleAuth('login');
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Connection error', 'error'); }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            currentToken = data.token;
            initApp();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Connection error', 'error'); }
}

function handleLogout() {
    localStorage.clear();
    location.reload();
}

function initApp() {
    const nav = document.getElementById('nav-links');
    const authScreen = document.getElementById('auth-screen');
    const patientDash = document.getElementById('patient-dashboard');
    const adminDash = document.getElementById('admin-dashboard');

    if (!currentUser) {
        authScreen.style.display = 'block';
        patientDash.style.display = 'none';
        adminDash.style.display = 'none';
        nav.innerHTML = '';
        return;
    }

    authScreen.style.display = 'none';
    nav.innerHTML = `<span>Welcome, ${currentUser.name}</span> <button onclick="handleLogout()">Logout</button>`;

    if (currentUser.role === 'admin') {
        adminDash.style.display = 'block';
        loadAdminData();
    } else {
        patientDash.style.display = 'block';
        loadPatientData();
    }
}

// Patient Logic
async function loadPatientData() {
    loadDoctors();
    loadAppointments();
}

async function loadDoctors() {
    const res = await fetch(`${API_URL}/doctors`);
    const doctors = await res.json();
    const list = document.getElementById('doctor-list');
    list.innerHTML = doctors.map(d => `
        <div class="doctor-card">
            <h3>Dr. ${d.name}</h3>
            <p class="spec">${d.specialization}</p>
            <p class="availability">Available: ${d.availableDays.join(', ')}</p>
            <button class="btn-primary" onclick="openBookingModal('${d._id}', '${d.name}')">Book Appointment</button>
        </div>
    `).join('');
}

async function loadAppointments() {
    const res = await fetch(`${API_URL}/appointments/user/${currentUser.id}`);
    const apps = await res.json();
    const list = document.getElementById('appointment-history');
    list.innerHTML = apps.map(a => `
        <div class="history-item">
            <strong>${a.doctor.name}</strong><br>
            <small>${a.date} | ${a.timeSlot}</small><br>
            <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
        </div>
    `).join('');
}

function openBookingModal(id, name) {
    selectedDoctorId = id;
    document.getElementById('booking-doctor-name').textContent = `Booking with Dr. ${name}`;
    document.getElementById('booking-modal').style.display = 'block';
}

function closeBookingModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

async function confirmBooking() {
    const date = document.getElementById('booking-date').value;
    const timeSlot = document.getElementById('booking-slot').value;

    if (!date) return showToast('Please select a date', 'error');

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctorId: selectedDoctorId, date, timeSlot, userId: currentUser.id })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Appointment successfully booked');
            closeBookingModal();
            loadAppointments();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Error booking appointment', 'error'); }
}

// Admin Logic
async function loadAdminData() {
    const dRes = await fetch(`${API_URL}/doctors`);
    const doctors = await dRes.json();
    document.getElementById('admin-doctor-list').innerHTML = doctors.map(d => `
        <div class="doctor-card">
            <h3>Dr. ${d.name}</h3>
            <p class="spec">${d.specialization}</p>
            <button class="btn-primary" style="background:var(--error)" onclick="deleteDoctor('${d._id}')">Delete</button>
        </div>
    `).join('');

    const aRes = await fetch(`${API_URL}/appointments`);
    const apps = await aRes.json();
    document.getElementById('admin-appointment-list').innerHTML = apps.map(a => `
        <div class="history-item">
            <strong>Patient: ${a.patient?.name || 'Unknown'}</strong><br>
            Doctor: Dr. ${a.doctor?.name || 'Unknown'}<br>
            <small>${a.date} | ${a.timeSlot}</small>
        </div>
    `).join('');
}

async function handleAddDoctor() {
    const name = document.getElementById('doc-name-inp').value;
    const specialization = document.getElementById('doc-spec-inp').value;
    const days = document.getElementById('doc-days-inp').value.split(',').map(s => s.trim());

    if (!name || !specialization) return showToast('Name and specialization required', 'error');

    await fetch(`${API_URL}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, specialization, availableDays: days })
    });
    showToast('Doctor added');
    loadAdminData();
}

async function deleteDoctor(id) {
    await fetch(`${API_URL}/doctors/${id}`, { method: 'DELETE' });
    showToast('Doctor deleted');
    loadAdminData();
}

// Start
initApp();
