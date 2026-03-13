const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : `https://${window.location.hostname}/api`;

// ── DEMO / MOCK DATA ───────────────────────────────────────────
const DEMO_DOCTORS = [
  { _id: '1', name: 'Kumar', specialization: 'Cardiologist', availableDays: ['Monday', 'Wednesday', 'Friday'] },
  { _id: '2', name: 'Priya', specialization: 'Dermatologist', availableDays: ['Tuesday', 'Thursday'] },
  { _id: '3', name: 'Arjun', specialization: 'Orthopedic', availableDays: ['Monday', 'Wednesday'] },
  { _id: '4', name: 'Meera', specialization: 'Neurologist', availableDays: ['Tuesday', 'Friday'] },
  { _id: '5', name: 'Raj', specialization: 'Pediatrician', availableDays: ['Monday', 'Thursday', 'Saturday'] },
];

const DEMO_APPOINTMENTS = [
  { _id: 'a1', doctor: { name: 'Kumar' }, date: '2026-03-20', timeSlot: '10:00 AM', status: 'Booked' },
  { _id: 'a2', doctor: { name: 'Priya' }, date: '2026-03-15', timeSlot: '11:30 AM', status: 'Completed' },
];

let DEMO_ALL_APPOINTMENTS = [
  { _id: 'da1', patient: { name: 'Shalini' }, doctor: { name: 'Kumar' }, date: '2026-03-20', timeSlot: '10:00 AM', status: 'Booked' },
  { _id: 'da2', patient: { name: 'Rahul' }, doctor: { name: 'Priya' }, date: '2026-03-18', timeSlot: '11:00 AM', status: 'Booked' },
];

let USE_DEMO = true;

async function safeFetch(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (res.ok) USE_DEMO = false;
    return res;
  } catch {
    USE_DEMO = true;
    return null;
  }
}

// ───────────────────────────────────────────────────────────────

let currentUser = JSON.parse(localStorage.getItem('user'));
let currentToken = localStorage.getItem('token');
let selectedDoctorId = null;
let myAppointments = [...DEMO_APPOINTMENTS];

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
  if (!name || !email || !password) return showToast('All fields required', 'error');

  const res = await safeFetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });

  if (USE_DEMO) {
    showToast('Registered successfully! (Demo mode)');
    toggleAuth('login');
  } else {
    const data = await res.json();
    res.ok ? (showToast('Registered! Please login.'), toggleAuth('login')) : showToast(data.message, 'error');
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showToast('Enter email & password', 'error');

  const res = await safeFetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (USE_DEMO) {
    const role = email.toLowerCase().includes('doctor') ? 'doctor' : 'patient';
    currentUser = { id: 'demo1', name: email.split('@')[0], email: email, role };
    currentToken = 'demo-token';
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', currentToken);
    showToast(`Welcome, ${currentUser.name}! (Demo mode)`);
    
    // Add smooth transition
    document.getElementById('auth-screen').classList.add('fade-out');
    setTimeout(() => initApp(), 400);
  } else {
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      currentUser = data.user; currentToken = data.token;
      initApp();
    } else { showToast(data.message, 'error'); }
  }
}

function handleLogout() {
  localStorage.clear();
  location.reload();
}

function initApp() {
  const nav = document.getElementById('nav-links');
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('patient-dashboard').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'none';

  if (!currentUser) {
    document.getElementById('auth-screen').style.display = 'block';
    nav.innerHTML = '';
    return;
  }

  // FIXED HEADER: Showing Name and Role
  nav.innerHTML = `
    <div style="text-align:right;">
        <span style="display:block; font-size:0.9rem; font-weight:700;">${currentUser.name}</span>
        <span style="display:block; font-size:0.75rem; color:var(--text-dim); margin-bottom:0.5rem;">${currentUser.email || ''} (${currentUser.role})</span>
        <button onclick="handleLogout()" style="padding:0.3rem 0.8rem; font-size:0.75rem;">Logout</button>
    </div>`;

  if (currentUser.role === 'doctor') {
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAdminData();
  } else {
    document.getElementById('patient-dashboard').style.display = 'block';
    loadPatientData();
  }
}

async function loadPatientData() { 
  loadDoctors(); 
  renderAppointments(); 
  updateReminder();
}

function updateReminder() {
  const next = myAppointments.find(a => a.status === 'Booked');
  const reminderDiv = document.getElementById('reminder-box');
  if (next) {
    reminderDiv.innerHTML = `
      <div style="background:rgba(59, 130, 246, 0.1); border:1px solid var(--primary); padding:1.25rem; border-radius:1rem; margin-bottom:2.5rem; border-left: 5px solid var(--primary);">
        <h4 style="color:var(--accent); margin-bottom:0.25rem; display:flex; align-items:center; gap:0.5rem;">🔔 Next Appointment Reminder</h4>
        <p style="font-size:0.95rem;">You have a scheduled visit with <strong>Dr. ${next.doctor.name}</strong> on <strong>${next.date}</strong> at <strong>${next.timeSlot}</strong>.</p>
      </div>`;
  } else {
    reminderDiv.innerHTML = '';
  }
}

async function loadDoctors() {
  const res = await safeFetch(`${API_URL}/doctors`);
  const doctors = USE_DEMO ? DEMO_DOCTORS : await res.json();

  document.getElementById('doctor-list').innerHTML = doctors.map(d => `
    <div class="doctor-card">
      <div style="font-size:2rem;text-align:center;margin-bottom:0.5rem;">🩺</div>
      <h3>Dr. ${d.name}</h3>
      <p class="spec">${d.specialization}</p>
      <p class="availability">📅 ${d.availableDays.join(', ')}</p>
      <button class="btn-primary" onclick="openBookingModal('${d._id}', '${d.name}')">Book Appointment</button>
    </div>
  `).join('');
}

function renderAppointments() {
  const list = document.getElementById('appointment-history');
  if (!myAppointments.length) { list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:1rem;">No appointments yet.</p>'; return; }
  list.innerHTML = myAppointments.map(a => `
    <div class="history-item">
      <strong>Dr. ${a.doctor.name}</strong><br>
      <small>📅 ${a.date} &nbsp;⏰ ${a.timeSlot}</small><br>
      <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
    </div>
  `).join('');
}

async function loadAppointments() {
  const res = await safeFetch(`${API_URL}/appointments/user/${currentUser.id}`);
  if (!USE_DEMO) { myAppointments = await res.json(); }
  renderAppointments();
  updateReminder();
}

function openBookingModal(id, name) {
  selectedDoctorId = id;
  document.getElementById('booking-doctor-name').textContent = `🩺 Booking with Dr. ${name}`;
  document.getElementById('booking-modal').style.display = 'block';
}

function closeBookingModal() {
  document.getElementById('booking-modal').style.display = 'none';
}

async function confirmBooking() {
  const date = document.getElementById('booking-date').value;
  const timeSlot = document.getElementById('booking-slot').value;
  if (!date) return showToast('Please select a date', 'error');

  if (USE_DEMO) {
    // Check for conflict against ALL appointments (other patients too)
    const conflict = DEMO_ALL_APPOINTMENTS.find(a => 
      a.doctor.name.includes(document.getElementById('booking-doctor-name').textContent.replace('🩺 Booking with Dr. ', '')) && 
      a.date === date && 
      a.timeSlot === timeSlot &&
      (a.status === 'Booked' || a.status === 'Completed')
    );

    if (conflict) {
      return showToast(`Slot Conflict! This time is already booked by another patient.`, 'error');
    }

    const doctorName = document.getElementById('booking-doctor-name').textContent.replace('🩺 Booking with Dr. ', '');
    myAppointments.unshift({ doctor: { name: doctorName }, date, timeSlot, status: 'Booked' });
    
    // Add to global admin list
    DEMO_ALL_APPOINTMENTS.unshift({ _id: Date.now().toString(), patient: { name: currentUser.name }, doctor: { name: doctorName }, date, timeSlot, status: 'Booked' });

    showToast('Appointment successfully booked ✅');
    closeBookingModal();
    renderAppointments();
    updateReminder();
  } else {
    const res = await safeFetch(`${API_URL}/appointments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctorId, date, timeSlot, userId: currentUser.id })
    });
    const data = await res.json();
    res.ok ? (showToast('Appointment successfully booked ✅'), closeBookingModal(), loadAppointments()) : showToast(data.message, 'error');
  }
}

// Admin Logic
let adminDoctors = [...DEMO_DOCTORS];

async function loadAdminData() {
  const dRes = await safeFetch(`${API_URL}/doctors`);
  if (!USE_DEMO) adminDoctors = await dRes.json();

  document.getElementById('admin-doctor-list').innerHTML = adminDoctors.map(d => `
    <div class="doctor-card" style="padding: 1.5rem;">
      <h4 style="margin-bottom:0.25rem;">Dr. ${d.name}</h4>
      <p class="spec" style="margin-bottom:0.75rem;">${d.specialization}</p>
      <button class="btn-primary" style="background:rgba(239, 68, 68, 0.2); color:var(--error); padding: 0.5rem; font-size: 0.75rem;" onclick="deleteDoctor('${d._id}')">🗑 Delete Doctor</button>
    </div>
  `).join('');

  const aRes = await safeFetch(`${API_URL}/appointments`);
  const apps = USE_DEMO ? DEMO_ALL_APPOINTMENTS : await aRes.json();
  document.getElementById('admin-appointment-list').innerHTML = apps.length
    ? apps.map((a, idx) => `
        <div class="history-item">
          <strong>👤 ${a.patient?.name || 'Patient'}</strong><br>
          Dr. ${a.doctor?.name || 'Doctor'}<br>
          <small>📅 ${a.date} &nbsp;⏰ ${a.timeSlot}</small><br>
          <div style="margin-top:0.5rem; display:flex; gap:0.5rem; align-items:center;">
             <span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span>
             ${a.status === 'Booked' ? `
               <button onclick="updateAppStatus(${idx}, 'Completed')" style="background:none; border:none; color:var(--success); font-size:0.75rem; cursor:pointer; font-weight:700; text-decoration:underline;">Complete</button>
               <button onclick="updateAppStatus(${idx}, 'Cancelled')" style="background:none; border:none; color:var(--error); font-size:0.75rem; cursor:pointer; font-weight:700; text-decoration:underline;">Cancel</button>
             ` : ''}
          </div>
        </div>`).join('')
    : '<p style="color:var(--text-dim);text-align:center;padding:1rem;">No appointments.</p>';
}

function updateAppStatus(idx, status) {
  if (USE_DEMO) {
    DEMO_ALL_APPOINTMENTS[idx].status = status;
    showToast(`Appointment marked as ${status}`);
    loadAdminData();
  }
}

async function handleAddDoctor() {
  const name = document.getElementById('doc-name-inp').value.trim();
  const specialization = document.getElementById('doc-spec-inp').value.trim();
  const days = document.getElementById('doc-days-inp').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name || !specialization) return showToast('Name and specialization required', 'error');

  if (USE_DEMO) {
    adminDoctors.unshift({ _id: Date.now().toString(), name, specialization, availableDays: days.length ? days : ['Monday'] });
    showToast(`Dr. ${name} added successfully ✅`);
    document.getElementById('doc-name-inp').value = '';
    document.getElementById('doc-spec-inp').value = '';
    document.getElementById('doc-days-inp').value = '';
    loadAdminData();
  } else {
    await safeFetch(`${API_URL}/doctors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, specialization, availableDays: days }) });
    showToast('Doctor added successfully ✅');
    loadAdminData();
  }
}

async function deleteDoctor(id) {
  if (USE_DEMO) {
    adminDoctors = adminDoctors.filter(d => d._id !== id);
    showToast('Doctor removed from system');
    loadAdminData();
  } else {
    await safeFetch(`${API_URL}/doctors/${id}`, { method: 'DELETE' });
    showToast('Doctor removed from system');
    loadAdminData();
  }
}

initApp();
