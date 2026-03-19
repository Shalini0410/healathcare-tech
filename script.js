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
      
      // If doctor, fetch their specific doctorId
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
  const upcomingList = document.getElementById('appointment-upcoming');
  const historyList = document.getElementById('appointment-history');
  
  if (!upcomingList || !historyList) return;

  const upcoming = myAppointments.filter(a => a.status === 'Booked' || a.status === 'In-Progress');
  const history = myAppointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');

  const renderCard = (a) => {
    return `
    <div class="history-item">
      <div class="info">
        <strong>Dr. ${a.doctor?.name || 'Unknown'}</strong><br>
        <small>📅 ${a.date} &nbsp;⏰ ${a.timeSlot}</small><br>
        <span class="status-badge status-${a.status.toLowerCase().replace('in-progress', 'progress')}">${a.status}</span>
      </div>
      ${a.status === 'Completed' && (a.diagnosis || a.treatmentRecord) ? `
      <div class="actions">
        <button class="btn-small btn-progress" onclick="viewMedicalRecord('${a.diagnosis || ''}', '${(a.treatmentRecord || '').replace(/'/g, "\\'")}', '${(a.notes || '').replace(/'/g, "\\'")}')">View Record</button>
      </div>` : ''}
    </div>`;
  };

  upcomingList.innerHTML = upcoming.length ? upcoming.map(renderCard).join('') : '<p style="color:var(--text-dim);padding:0.5rem 0;">No upcoming appointments.</p>';
  historyList.innerHTML = history.length ? history.map(renderCard).join('') : '<p style="color:var(--text-dim);padding:0.5rem 0;">No past history.</p>';
}

function viewMedicalRecord(diagnosis, treatment, notes) {
  document.getElementById('record-title').textContent = 'Your Medical Record';
  document.getElementById('record-diagnosis').value = diagnosis;
  document.getElementById('record-treatment').value = treatment;
  document.getElementById('record-notes').value = notes;
  
  // Make inputs read-only for patient
  document.getElementById('record-diagnosis').readOnly = true;
  document.getElementById('record-treatment').readOnly = true;
  document.getElementById('record-notes').readOnly = true;
  document.getElementById('record-save-btn').style.display = 'none';
  
  document.getElementById('record-modal').style.display = 'flex';
}

function closeRecordModal() {
  document.getElementById('record-modal').style.display = 'none';
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
    const doctorName = document.getElementById('booking-doctor-name').textContent.replace('🩺 Booking with Dr. ', '').trim();
    
    // Check for conflict against ALL appointments
    const conflict = DEMO_ALL_APPOINTMENTS.find(a => {
      const matchDoctor = (a.doctor?.name === doctorName) || (a.doctor === doctorName);
      return matchDoctor && 
             a.date === date && 
             a.timeSlot === timeSlot &&
             (a.status === 'Booked' || a.status === 'Completed');
    });

    if (conflict) {
      console.log('Conflict detected:', conflict);
      return showToast(`Already Booked! Dr. ${doctorName} is busy at this time.`, 'error');
    }

    myAppointments.unshift({ doctor: { name: doctorName }, date, timeSlot, status: 'Booked' });
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

// Admin/Doctor Logic
let adminDoctors = [...DEMO_DOCTORS];

async function loadAdminData() {
  const dRes = await safeFetch(`${API_URL}/doctors`);
  if (!USE_DEMO) adminDoctors = await dRes.json();

  document.getElementById('admin-doctor-list').innerHTML = adminDoctors.map(d => `
    <div class="doctor-card">
      <div class="info">
        <h3>Dr. ${d.name}</h3>
        <p class="spec">${d.specialization}</p>
        <p class="availability">📅 ${d.availableDays.join(', ')}</p>
      </div>
      <button class="btn-small btn-cancel" onclick="deleteDoctor('${d._id}')">🗑 Remove</button>
    </div>
  `).join('');

  let apps = [];
  if (USE_DEMO) {
      apps = DEMO_ALL_APPOINTMENTS.filter(a => a.doctor.name === currentUser.name);
  } else {
      const aRes = await safeFetch(`${API_URL}/appointments/doctor/${currentUser.doctorId}`);
      if (aRes) apps = await aRes.json();
  }

  // Update Counters
  const total = apps.length;
  const seen = apps.filter(a => a.status === 'Completed').length;
  const waiting = apps.filter(a => a.status === 'Booked' || a.status === 'In-Progress').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-seen').textContent = seen;
  document.getElementById('stat-waiting').textContent = waiting;

  // Render Chronological Schedule
  const sortedApps = [...apps].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + (a.timeSlot.includes('AM') || a.timeSlot.includes('PM') ? a.timeSlot : ''));
    const dateB = new Date(b.date + ' ' + (b.timeSlot.includes('AM') || b.timeSlot.includes('PM') ? b.timeSlot : ''));
    return dateA - dateB;
  });

  document.getElementById('admin-appointment-list').innerHTML = sortedApps.length
    ? sortedApps.map((a) => {
        // Find index in DEMO_ALL_APPOINTMENTS for status updates
        const realIdx = USE_DEMO ? DEMO_ALL_APPOINTMENTS.findIndex(item => item._id === a._id) : -1;
        return `
        <div class="history-item">
          <div class="info">
            <strong>👤 ${a.patient?.name || 'Patient'}</strong><br>
            <small>📅 ${a.date} • ⏰ ${a.timeSlot}</small><br>
            <span class="status-badge status-${a.status.toLowerCase().replace('in-progress', 'progress')}">${a.status}</span>
          </div>
          <div class="actions">
             ${a.status === 'Booked' ? `
               <button class="btn-small btn-progress" onclick="updateAppStatus(${realIdx}, 'In-Progress', '${a._id}')">In-Progress</button>
             ` : ''}
             ${a.status !== 'Completed' && a.status !== 'Cancelled' ? `
               <button class="btn-small btn-complete" onclick="openMedicalRecordModal(${realIdx}, '${a._id}')">Complete Rec.</button>
               <button class="btn-small btn-cancel" onclick="updateAppStatus(${realIdx}, 'Cancelled', '${a._id}')">Cancel</button>
             ` : ''}
          </div>
        </div>`;
      }).join('')
    : '<p style="color:var(--text-dim);text-align:center;padding:1rem;">No appointments scheduled.</p>';
}

function updateAppStatus(idx, status, id) {
  if (USE_DEMO && idx !== -1) {
    DEMO_ALL_APPOINTMENTS[idx].status = status;
    showToast(`Status updated to ${status}`);
    loadAdminData();
  } else if (!USE_DEMO) {
    safeFetch(`${API_URL}/appointments/${id}/record`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => {
        showToast(`Status updated to ${status}`);
        loadAdminData();
    });
  }
}

let currentEditingAppId = null;
let currentEditingIdx = null;

function openMedicalRecordModal(idx, id) {
  currentEditingIdx = idx;
  currentEditingAppId = id;

  document.getElementById('record-title').textContent = 'Add Patient Medical Record';
  document.getElementById('record-diagnosis').value = '';
  document.getElementById('record-treatment').value = '';
  document.getElementById('record-notes').value = '';
  
  // Make inputs editable
  document.getElementById('record-diagnosis').readOnly = false;
  document.getElementById('record-treatment').readOnly = false;
  document.getElementById('record-notes').readOnly = false;
  document.getElementById('record-save-btn').style.display = 'block';
  
  document.getElementById('record-modal').style.display = 'flex';
}

async function saveRecordBtnClick() {
  const diagnosis = document.getElementById('record-diagnosis').value.trim();
  const treatment = document.getElementById('record-treatment').value.trim();
  const notes = document.getElementById('record-notes').value.trim();

  if (!diagnosis || !treatment) return showToast('Diagnosis and Treatment are required', 'error');

  if (USE_DEMO && currentEditingIdx !== -1) {
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].status = 'Completed';
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].diagnosis = diagnosis;
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].treatmentRecord = treatment;
    DEMO_ALL_APPOINTMENTS[currentEditingIdx].notes = notes;
    
    showToast('Record saved & Appointment Completed');
    closeRecordModal();
    loadAdminData();
  } else {
    const res = await safeFetch(`${API_URL}/appointments/${currentEditingAppId}/record`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosis, treatmentRecord: treatment, notes, status: 'Completed' })
    });
    
    if (res && res.ok) {
       showToast('Record saved & Appointment Completed');
       closeRecordModal();
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
