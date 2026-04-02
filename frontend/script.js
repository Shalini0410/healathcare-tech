const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://doctor-appointment-backend.onrender.com/api'; // REPLACE THIS WITH YOUR RENDER URL AFTER DEPLOYMENT

// ── DEMO / MOCK DATA ───────────────────────────────────────────
const DEMO_DOCTORS = [
  { _id: '1', name: 'Kumar', specialization: 'Cardiologist', availableDays: ['Mon', 'Wed', 'Fri'] },
  { _id: '2', name: 'Priya', specialization: 'Dermatologist', availableDays: ['Tue', 'Thu'] },
  { _id: '3', name: 'Arjun', specialization: 'Orthopedic', availableDays: ['Mon', 'Wed'] },
  { _id: '4', name: 'Meera', specialization: 'Neurologist', availableDays: ['Tue', 'Fri'] },
  { _id: '5', name: 'Raj', specialization: 'Pediatrician', availableDays: ['Mon', 'Thu', 'Sat'] },
];

const DEMO_APPOINTMENTS = [
  { _id: 'a1', doctor: { name: 'Kumar' }, date: '2026-04-05', timeSlot: '10:00 AM', status: 'Booked' },
  { _id: 'a2', doctor: { name: 'Priya' }, date: '2026-03-15', timeSlot: '11:30 AM', status: 'Completed', diagnosis: 'Mild Dermatitis', treatmentRecord: 'Apply hydrocortisone cream twice daily.' },
];

let DEMO_ALL_APPOINTMENTS = [
  { _id: 'da1', patient: { name: 'Shalini' }, doctor: { name: 'Kumar' }, date: '2026-04-05', timeSlot: '10:00 AM', status: 'Booked' },
  { _id: 'da2', patient: { name: 'Rahul' }, doctor: { name: 'Priya' }, date: '2026-04-06', timeSlot: '11:00 AM', status: 'Booked' },
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

// ── STATE ──────────────────────────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem('user'));
let currentToken = localStorage.getItem('token');
let selectedDoctorId = null;
let myAppointments = [...DEMO_APPOINTMENTS];

// ── CORE FUNCTIONS ───────────────────────────────────────────

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function toggleAuth(type) {
  document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = type === 'register' ? 'block' : 'none';
  refreshIcons();
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
    const role = email.toLowerCase().includes('doctor') || email.toLowerCase().includes('admin') ? 'doctor' : 'patient';
    currentUser = { id: 'demo1', name: email.split('@')[0], email: email, role };
    currentToken = 'demo-token';
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', currentToken);
    showToast(`Welcome, ${currentUser.name}!`);
    initApp();
  } else {
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      currentUser = data.user; currentToken = data.token;
      
      if (currentUser.role === 'doctor') {
         const dRes = await fetch(`${API_URL}/doctors`);
         const allDoc = await dRes.json();
         const myDocProfile = allDoc.find(d => d.userId === currentUser.id);
         if (myDocProfile) {
            localStorage.setItem('doctorId', myDocProfile._id);
            currentUser.doctorId = myDocProfile._id;
            currentUser.specialization = myDocProfile.specialization;
         }
      }
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
  const hero = document.getElementById('hero-section');
  const auth = document.getElementById('auth-screen');
  const patientDash = document.getElementById('patient-dashboard');
  const doctorDash = document.getElementById('admin-dashboard');

  // Hide all initially
  hero.style.display = 'none';
  auth.style.display = 'none';
  patientDash.style.display = 'none';
  doctorDash.style.display = 'none';

  if (!currentUser) {
    hero.style.display = 'block';
    auth.style.display = 'block';
    nav.innerHTML = '';
    return;
  }

  // Update Navigation with User Badge
  nav.innerHTML = `
    <div class="user-badge glass">
        <div class="doctor-avatar" style="width:24px; height:24px; font-size:0.75rem; margin:0;">
            ${currentUser.name[0]}
        </div>
        <div style="font-size:0.875rem;">
            <strong style="display:block; line-height:1;">${currentUser.name}</strong>
            <span style="color:var(--text-dim); font-size:0.7rem;">${currentUser.role}</span>
        </div>
        <button onclick="handleLogout()" style="background:none; border:none; color:var(--error); cursor:pointer; padding:0 0.5rem;" title="Logout">
            <i data-lucide="log-out" style="width:16px;"></i>
        </button>
    </div>`;

  if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
    doctorDash.style.display = 'block';
    const titleObj = document.getElementById('doctor-dashboard-title');
    if (titleObj) titleObj.innerHTML = `<i data-lucide="clock"></i> ${currentUser.specialization || 'Doctor'} Schedule`;
    loadAdminData();
  } else {
    patientDash.style.display = 'block';
    loadPatientData();
  }
  refreshIcons();
}

async function loadPatientData() { 
  loadDoctors(); 
  loadAppointments(); 
}

function updateReminder() {
  const next = myAppointments.find(a => a.status === 'Booked');
  const reminderDiv = document.getElementById('reminder-box');
  if (next) {
    reminderDiv.innerHTML = `
      <div class="glass" style="padding:1.5rem; border-radius:var(--radius-lg); margin-bottom:2rem; border-left:6px solid var(--primary); display:flex; align-items:center; gap:1.5rem;">
        <div class="doctor-avatar" style="background:var(--primary-light); color:var(--primary); margin:0;"><i data-lucide="bell"></i></div>
        <div>
            <h4 style="color:var(--primary); margin-bottom:0.25rem;">Next Appointment Reminder</h4>
            <p>You have a visit with <strong>Dr. ${next.doctor.name}</strong> on <strong>${next.date}</strong> at <strong>${next.timeSlot}</strong>.</p>
        </div>
      </div>`;
    refreshIcons();
  } else {
    reminderDiv.innerHTML = '';
  }
}

async function loadDoctors() {
  const res = await safeFetch(`${API_URL}/doctors`);
  const doctors = USE_DEMO ? DEMO_DOCTORS : await res.json();

  document.getElementById('doctor-list').innerHTML = doctors.map(d => `
    <div class="doctor-card glass">
      <div class="doctor-avatar">${d.name[0]}</div>
      <h3>Dr. ${d.name}</h3>
      <p class="spec">${d.specialization}</p>
      <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:1.5rem;">
        <i data-lucide="calendar" style="width:14px; vertical-align:middle;"></i> ${d.availableDays.join(', ')}
      </p>
      <button class="btn-primary" onclick="openBookingModal('${d._id}', '${d.name}')">Book Now</button>
    </div>
  `).join('');
  refreshIcons();
}

function renderAppointments() {
  const upcomingList = document.getElementById('appointment-upcoming');
  const historyList = document.getElementById('appointment-history');
  
  if (!upcomingList || !historyList) return;

  const upcoming = myAppointments.filter(a => a.status === 'Booked' || a.status === 'In-Progress');
  const history = myAppointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');

  const renderCard = (a) => {
    return `
    <div class="list-item">
      <div>
        <strong style="display:block;">Dr. ${a.doctor?.name || 'Unknown'}</strong>
        <small style="color:var(--text-dim); font-size:0.75rem;">
            <i data-lucide="clock" style="width:12px; vertical-align:middle;"></i> ${a.date} • ${a.timeSlot}
        </small>
      </div>
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span class="status-badge status-${a.status.toLowerCase().replace('in-progress', 'progress')}">${a.status}</span>
        ${a.status === 'Completed' ? `
            <button class="btn-primary btn-secondary" style="padding:0.4rem; width:32px; height:32px;" onclick="viewMedicalRecord('${a.diagnosis || ''}', '${(a.treatmentRecord || '').replace(/'/g, "\\'")}', '${(a.notes || '').replace(/'/g, "\\'")}')">
                <i data-lucide="eye" style="width:16px;"></i>
            </button>
        ` : ''}
      </div>
    </div>`;
  };

  upcomingList.innerHTML = upcoming.length ? upcoming.map(renderCard).join('') : '<p class="text-center" style="color:var(--text-dim); padding:1rem;">No upcoming visits.</p>';
  historyList.innerHTML = history.length ? history.map(renderCard).join('') : '<p class="text-center" style="color:var(--text-dim); padding:1rem;">No history found.</p>';
  refreshIcons();
}

function viewMedicalRecord(diagnosis, treatment, notes) {
  document.getElementById('record-title').innerHTML = '<i data-lucide="file-text"></i> Your Medical Record';
  document.getElementById('record-diagnosis').value = diagnosis;
  document.getElementById('record-treatment').value = treatment;
  document.getElementById('record-notes').value = notes;
  
  document.getElementById('record-diagnosis').readOnly = true;
  document.getElementById('record-treatment').readOnly = true;
  document.getElementById('record-notes').readOnly = true;
  document.getElementById('record-save-btn').style.display = 'none';
  
  openModal('record-modal');
}

function openModal(id) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('booking-modal').style.display = 'none';
    document.getElementById('record-modal').style.display = 'none';
    document.getElementById(id).style.display = 'block';
    refreshIcons();
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

async function loadAppointments() {
  const res = await safeFetch(`${API_URL}/appointments/user/${currentUser.id}`);
  if (!USE_DEMO) { myAppointments = await res.json(); }
  renderAppointments();
  updateReminder();
}

function openBookingModal(id, name) {
  selectedDoctorId = id;
  document.getElementById('booking-doctor-name').innerHTML = `<i data-lucide="user"></i> Specialist: Dr. ${name}`;
  openModal('booking-modal');
}

async function confirmBooking() {
  const date = document.getElementById('booking-date').value;
  const timeSlot = document.getElementById('booking-slot').value;
  if (!date) return showToast('Please select a date', 'error');

  if (USE_DEMO) {
    const doctorName = document.getElementById('booking-doctor-name').textContent.split(': ')[1].trim();
    myAppointments.unshift({ doctor: { name: doctorName }, date, timeSlot, status: 'Booked' });
    DEMO_ALL_APPOINTMENTS.unshift({ _id: Date.now().toString(), patient: { name: currentUser.name }, doctor: { name: doctorName }, date, timeSlot, status: 'Booked' });

    showToast('Appointment booked successfully! ✅');
    closeModal();
    renderAppointments();
    updateReminder();
  } else {
    const res = await safeFetch(`${API_URL}/appointments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctorId, date, timeSlot, userId: currentUser.id })
    });
    const data = await res.json();
    res.ok ? (showToast('Appointment booked ✅'), closeModal(), loadAppointments()) : showToast(data.message, 'error');
  }
}

// ── ADMIN / DOCTOR LOGIC ─────────────────────────────────────────
let adminDoctors = [...DEMO_DOCTORS];

async function loadAdminData() {
  const dRes = await safeFetch(`${API_URL}/doctors`);
  if (!USE_DEMO) adminDoctors = await dRes.json();

  document.getElementById('admin-doctor-list').innerHTML = adminDoctors.map(d => `
    <div class="doctor-card glass">
      <div class="doctor-avatar" style="width:40px; height:40px; font-size:1rem; margin-bottom:0.5rem;">${d.name[0]}</div>
      <h3 style="font-size:1rem;">Dr. ${d.name}</h3>
      <p class="spec" style="font-size:0.7rem;">${d.specialization}</p>
      <button class="btn-primary" style="background:#fee2e2; color:#991b1b; padding:0.4rem; font-size:0.7rem; margin-top:0.5rem;" onclick="deleteDoctor('${d._id}')">
        <i data-lucide="trash-2" style="width:12px;"></i> Remove
      </button>
    </div>
  `).join('');

  let apps = [];
  if (USE_DEMO) {
      apps = DEMO_ALL_APPOINTMENTS.filter(a => a.doctor.name === currentUser.name || currentUser.role === 'admin');
  } else {
      const aRes = await safeFetch(`${API_URL}/appointments/doctor/${currentUser.doctorId}`);
      if (aRes) apps = await aRes.json();
  }

  // Stats
  document.getElementById('stat-total').textContent = apps.length;
  document.getElementById('stat-seen').textContent = apps.filter(a => a.status === 'Completed').length;
  document.getElementById('stat-waiting').textContent = apps.filter(a => a.status === 'Booked' || a.status === 'In-Progress').length;

  // Chronological Schedule
  const sortedApps = [...apps].sort((a, b) => new Date(a.date) - new Date(b.date));

  document.getElementById('admin-appointment-list').innerHTML = sortedApps.length
    ? sortedApps.map((a) => {
        const realIdx = USE_DEMO ? DEMO_ALL_APPOINTMENTS.findIndex(item => item._id === a._id) : -1;
        return `
        <div class="list-item">
          <div>
            <strong>${a.patient?.name || 'Patient'}</strong>
            <small style="display:block; color:var(--text-dim);"><i data-lucide="clock" style="width:12px;"></i> ${a.date} • ${a.timeSlot}</small>
            <span class="status-badge status-${a.status.toLowerCase().replace('in-progress', 'progress')}">${a.status}</span>
          </div>
          <div style="display:flex; gap:0.5rem;">
             ${a.status === 'Booked' ? `
               <button class="btn-primary" style="padding:0.4rem; width:32px; height:32px;" onclick="updateAppStatus(${realIdx}, 'In-Progress', '${a._id}')" title="Start Visit">
                 <i data-lucide="play" style="width:14px;"></i>
               </button>
             ` : ''}
             ${a.status !== 'Completed' && a.status !== 'Cancelled' ? `
               <button class="btn-primary" style="padding:0.4rem; width:32px; height:32px; background:var(--success);" onclick="openMedicalRecordModal(${realIdx}, '${a._id}')" title="Complete Visit">
                 <i data-lucide="check" style="width:14px;"></i>
               </button>
               <button class="btn-primary" style="padding:0.4rem; width:32px; height:32px; background:var(--error);" onclick="updateAppStatus(${realIdx}, 'Cancelled', '${a._id}')" title="Cancel Appointment">
                 <i data-lucide="x" style="width:14px;"></i>
               </button>
             ` : ''}
          </div>
        </div>`;
      }).join('')
    : '<p class="text-center" style="color:var(--text-dim); padding:1rem;">Your schedule is clear.</p>';
  refreshIcons();
}

function updateAppStatus(idx, status, id) {
  if (USE_DEMO && idx !== -1) {
    DEMO_ALL_APPOINTMENTS[idx].status = status;
    showToast(`Status: ${status}`);
    loadAdminData();
  } else if (!USE_DEMO) {
    safeFetch(`${API_URL}/appointments/${id}/record`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => {
        showToast(`Status: ${status}`);
        loadAdminData();
    });
  }
}

let currentEditingAppId = null;
let currentEditingIdx = null;

function openMedicalRecordModal(idx, id) {
  currentEditingIdx = idx;
  currentEditingAppId = id;

  document.getElementById('record-title').innerHTML = '<i data-lucide="plus-circle"></i> Complete Patient Visit';
  document.getElementById('record-diagnosis').value = '';
  document.getElementById('record-treatment').value = '';
  document.getElementById('record-notes').value = '';
  
  document.getElementById('record-diagnosis').readOnly = false;
  document.getElementById('record-treatment').readOnly = false;
  document.getElementById('record-notes').readOnly = false;
  document.getElementById('record-save-btn').style.display = 'block';
  
  openModal('record-modal');
}

async function saveRecordBtnClick() {
  const diagnosis = document.getElementById('record-diagnosis').value.trim();
  const treatment = document.getElementById('record-treatment').value.trim();
  const notes = document.getElementById('record-notes').value.trim();

  if (!diagnosis || !treatment) return showToast('Diagnosis and Treatment required', 'error');

  if (USE_DEMO && currentEditingIdx !== -1) {
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].status = 'Completed';
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].diagnosis = diagnosis;
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].treatmentRecord = treatment;
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].notes = notes;
    
    showToast('Patient record saved ✅');
    closeModal();
    loadAdminData();
  } else {
    const res = await safeFetch(`${API_URL}/appointments/${currentEditingAppId}/record`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis, treatmentRecord: treatment, notes, status: 'Completed' })
    });
    
    if (res && res.ok) {
       showToast('Record saved ✅');
       closeModal();
       loadAdminData();
    } else {
       showToast('Failed to save record', 'error');
    }
  }
}

async function handleAddDoctor() {
  const name = document.getElementById('doc-name-inp').value.trim();
  const specialization = document.getElementById('doc-spec-inp').value.trim();
  const days = document.getElementById('doc-days-inp').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!name || !specialization) return showToast('Name and specialization required', 'error');

  if (USE_DEMO) {
    adminDoctors.unshift({ _id: Date.now().toString(), name, specialization, availableDays: days.length ? days : ['Mon'] });
    showToast(`Dr. ${name} added ✅`);
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
    showToast('Specialist removed');
    loadAdminData();
  } else {
    await safeFetch(`${API_URL}/doctors/${id}`, { method: 'DELETE' });
    showToast('Specialist removed');
    loadAdminData();
  }
}

// Initial Run
initApp();
