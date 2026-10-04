// ---------------------------------------------------------------------
// OneSignal Web Push
// The App ID below is public by design (it's meant to ship in client code).
// The REST API Key is NOT here and must never be — it's a secret that lives
// only on your backend (see sendNoticePush() further down, and the sample
// Netlify Function provided alongside this file).
// ---------------------------------------------------------------------
const ONESIGNAL_APP_ID = "1bcdf8fd-ba5b-466f-847c-f7781d16c814";

window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async (OneSignal) => {
  await OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    // Merge into our existing service-worker.js (which importScripts() the
    // OneSignal worker) instead of letting OneSignal register a second,
    // separate service worker at a conflicting scope.
    serviceWorkerParam: { scope: "/" },
    serviceWorkerPath: "service-worker.js",
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true
  });
});

async function enableOneSignalPush() {
  if (!window.OneSignalDeferred) return false;
  return new Promise((resolve) => {
    OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        if (!optedIn) await OneSignal.User.PushSubscription.optIn();
        resolve(true);
      } catch (error) {
        console.error("OneSignal opt-in failed:", error);
        resolve(false);
      }
    });
  });
}

let deferredInstallPrompt = null;
let swRegistration = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      swRegistration = await navigator.serviceWorker.register("/service-worker.js");
      await requestNotificationPermission();
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error("Notification permission request failed:", error);
    return "denied";
  }
}

async function sendNotification(title, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const payload = { icon: logoPath, badge: logoPath, ...options };
  try {
    const registration = swRegistration || (navigator.serviceWorker && (await navigator.serviceWorker.getRegistration()));
    if (registration && registration.showNotification) {
      await registration.showNotification(title, payload);
      return;
    }
  } catch (error) {
    console.error("Service worker notification failed, falling back:", error);
  }
  try {
    new Notification(title, payload);
  } catch (error) {
    console.error("Local notification failed:", error);
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderInstallPromptUI();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  renderInstallPromptUI();
});

const logoPath = "assets/seminary.png";
const today = () => new Date().toLocaleDateString("en-CA");
const addDays = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toLocaleDateString("en-CA"); };
const weekKey = () => { const date = new Date(); const first = new Date(date.getFullYear(), 0, 1); const week = Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7); return date.getFullYear() + "-W" + String(week).padStart(2, "0"); };
const monthName = () => new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

const seedData = {
  students: [
    { id: "SC1001", roll: "01", password: "student123", name: "Aarav Sharma", fatherName: "Rohit Sharma", motherName: "Neha Sharma", className: "10", section: "A", mobile: "+91 98765 43210", address: "Patna, Bihar", photo: "", attendance: 92, payments: [{ month: "May 2026", amount: 2500, dueDate: addDays(5), status: "Due" }] },
    { id: "SC1002", roll: "02", password: "student123", name: "Meera Khan", fatherName: "Imran Khan", motherName: "Sana Khan", className: "12", section: "B", mobile: "+91 97654 32109", address: "Ranchi, Jharkhand", photo: "", attendance: 86, payments: [{ month: "May 2026", amount: 2800, dueDate: addDays(4), status: "Paid" }] }
  ],
  dailyAttendance: [{ id: "DA01", date: today(), studentId: "SC1001", studentName: "Aarav Sharma", className: "10", section: "A", roll: "01", status: "Present" }],
  staff: [{ id: "T01", name: "Mr. Rajesh Verma", subject: "Mathematics", role: "Teacher" }, { id: "T02", name: "Ms. Anjali Singh", subject: "English", role: "Teacher" }, { id: "A01", name: "Office Admin", subject: "Operations", role: "Admin" }],
  notices: [{ id: "N01", language: "English", title: "Weekly Test Schedule", body: "The weekly test will be conducted on Saturday at 10:00 AM.", createdAt: today() }],
  lectures: [{ id: "L01", title: "Algebra Revision", teacher: "Mr. Rajesh Verma", className: "10", fileName: "sample-algebra.mp4", url: "", type: "mp4", size: "normal" }],
  reports: [{ id: "R01", studentId: "SC1001", studentName: "Aarav Sharma", staff: "Office Admin", issue: "ID card correction requested.", status: "Open", className: "10" }],
  ratings: [{ id: "RT01", studentId: "SC1001", studentName: "Aarav Sharma", teacher: "Mr. Rajesh Verma", week: weekKey(), month: monthName(), score: 5 }],
  studentReports: [],
  gallery: [],
  admin: { id: "seminary_admin", password: "seminary_director", name: "Seminary Admin" }
};

let data = normalize(loadData());
let state = createDefaultState();
const $ = (query) => document.querySelector(query);
const $$ = (query) => Array.prototype.slice.call(document.querySelectorAll(query));
const uid = (prefix) => prefix + Date.now() + Math.floor(Math.random() * 1000);
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function getStore(key) { try { return localStorage.getItem(key); } catch (error) { return null; } }
function setStore(key, value) { try { localStorage.setItem(key, value); } catch (error) {} }
function on(selector, eventName, handler) { const element = $(selector); if (element) element.addEventListener(eventName, handler); }
function loadData() { const saved = getStore("seminaryData"); if (!saved) return clone(seedData); try { return JSON.parse(saved); } catch (error) { return clone(seedData); } }
function saveData() { setStore("seminaryData", JSON.stringify(data)); }
function fileToDataUrl(file) { return new Promise((resolve) => { if (!file) { resolve(""); return; } const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => resolve(""); reader.readAsDataURL(file); }); }

const SESSION_KEY = "seminarySession";
function createDefaultState() { return { screen: "greeting", role: null, user: null, active: "profile", noticeLanguage: "English", search: { name: "", className: "", roll: "", section: "" }, selectedAttendanceClass: "", selectedPaymentClass: "", openGalleryMenu: null, editingStudentId: null }; }
function getStoredSession() { const saved = getStore(SESSION_KEY); if (!saved) return null; try { return JSON.parse(saved); } catch (error) { return null; } }
function findSessionUser(session) { if (!session || !session.role || !session.id) return null; return session.role === "admin" ? (data.admin.id === session.id ? data.admin : null) : data.students.find((student) => student.id === session.id); }
function saveSession(role, user) { setStore(SESSION_KEY, JSON.stringify({ role, id: user.id, savedAt: new Date().toISOString() })); }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (error) {} }
function restoreSession() { const session = getStoredSession(); const user = findSessionUser(session); if (!user) { clearSession(); return false; } state = { ...createDefaultState(), screen: "main", role: session.role, user, active: session.role === "admin" ? "dashboard" : "profile", selectedAttendanceClass: user.className || "", selectedPaymentClass: user.className || "" }; return true; }
function isAppInstalled() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function installPromptMarkup() { if (!deferredInstallPrompt || isAppInstalled()) return ""; return `<div class="push-bar install-prompt"><div><strong>Install Seminary Classes</strong><p class="hint">Add this app to your home screen for faster access.</p></div><button class="primary" type="button" data-install-app>Install App</button></div>`; }
function notificationPromptMarkup() { if (!("Notification" in window) || Notification.permission !== "default") return ""; return `<div class="push-bar notification-prompt"><div><strong>Turn On Notifications</strong><p class="hint">Get notified instantly when a new notice or update is posted.</p></div><button class="primary" type="button" data-enable-notifications>Enable Notifications</button></div>`; }
async function enableNotifications() { await requestNotificationPermission(); await enableOneSignalPush(); renderInstallPromptUI(); }
function renderInstallPromptUI() { if (!document.getElementById("app")) return; if (state.screen === "greeting" || state.screen === "login" || state.screen === "main") render(); }
async function promptInstallApp() { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice.catch(() => undefined); deferredInstallPrompt = null; renderInstallPromptUI(); }

function normalize(saved) {
  const merged = Object.assign(clone(seedData), saved || {});
  merged.students = (merged.students || []).map((s, index) => ({
    id: s.id || "SC" + (1000 + index), roll: s.roll || String(index + 1).padStart(2, "0"), password: s.password || "student123", name: s.name || "", fatherName: s.fatherName || "Not added", motherName: s.motherName || "Not added", className: s.className || "", section: s.section || "A", mobile: s.mobile || "", address: s.address || "", photo: s.photo || "", attendance: Number(s.attendance || 0), payments: (s.payments || []).map((p) => ({ month: p.month || "Monthly Fee", amount: p.amount || 0, dueDate: p.dueDate || addDays(5), status: p.status || "Due" }))
  }));
  return merged;
}

function greetingText() { const hour = new Date().getHours(); if (hour < 12) return "Good Morning"; if (hour < 17) return "Good Afternoon"; if (hour < 21) return "Good Evening"; return "Good Night"; }
function currentStudent() { return state.role === "student" ? state.user : data.students[0] || {}; }
function ratingLabel(score) { return { 1: "Poor", 2: "Need Improvement", 3: "Good", 4: "Very Good", 5: "Excellent" }[score] || "Not rated"; }

function feeSummary(student) {
  const hasDue = (student.payments || []).some((p) => p.status === "Due");
  return hasDue ? `<span class="badge red">Due</span>` : `<span class="badge green">Paid</span>`;
}

function render() { $("#app").innerHTML = { greeting: greetingPage, login: loginPage, main: mainPage, goodbye: goodbyePage }[state.screen](); bindEvents(); }

function brandBlock(showGreeting = true) { return `<div class="logo-wrap">${showGreeting ? `<div class="script greeting-script">${greetingText()}</div>` : ""}<img class="logo" src="${logoPath}" alt="Seminary Classes flying eagle logo"><p class="script quote-script">Acquire Knowledge and Impart it to the People</p></div>`; }
function greetingPage() { return `<main class="hero"><section class="hero-panel">${brandBlock(true)}<div class="hero-copy"><h1>Seminary Classes</h1><p class="lead">A blue learning dashboard for students and administrators.</p>${installPromptMarkup()}${notificationPromptMarkup()}<button class="primary" data-go-login>Start Learning</button></div></section></main>`; }
function loginPage() { return `<main class="login-layout"><section class="login-panel"><div class="login-brand">${brandBlock(true)}</div><form class="login-form" data-login-form><h2>Institution Login</h2><p class="hint">Login with institution student or admin data.</p>${installPromptMarkup()}${notificationPromptMarkup()}<label class="field"><span>User type</span><select name="role"><option value="student">Student</option><option value="admin">Admin</option></select></label><label class="field"><span>Student ID or Admin ID</span><input name="id" placeholder="SC1001" required></label><label class="field"><span>Password</span><span class="password-wrap"><input name="password" type="password" placeholder="Password" autocomplete="current-password" required><button class="eye-toggle" type="button" data-toggle-password aria-label="Show password" aria-pressed="false">${eyeIcon(false)}</button></span></label><div class="error" data-login-error></div><button class="primary" type="submit">Login</button> <button class="ghost" type="button" data-back-home>Back</button></form></section></main>`; }

function eyeIcon(open) { return open ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`; }
function escapeAttr(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function mainPage() {
  const userPhoto = state.role === "student" && state.user.photo ? state.user.photo : logoPath;
  const nav = state.role === "admin"
    ? [["dashboard", "Admin Dashboard"], ["students", "Student Data"], ["dailyAttendance", "Everyday Attendance"], ["notices", "Notice Board"], ["payments", "Payment History"], ["reports", "Report Staff"], ["studentReports", "Report Student"], ["gallery", "Class Gallery"], ["lectures", "Recorded Lectures"], ["ratings", "Teacher Ratings"], ["staff", "Add Staff"]]
    : [["profile", "Student Profile"], ["dailyAttendance", "Everyday Attendance"], ["notices", "Notice Board"], ["payments", "Payment History"], ["reports", "Report Staff"], ["studentReports", "Report Student"], ["gallery", "Class Gallery"], ["lectures", "Recorded Lectures"], ["ratings", "Teacher Ratings"]];
  return `<div class="app-shell"><header class="topbar"><div class="brand-mini"><img src="${userPhoto}" alt="Profile"><div><strong>Seminary Classes</strong><small>${state.role === "admin" ? "Admin Control Center" : state.user.name}</small></div></div><button class="danger" data-logout>Log Out</button></header>${installPromptMarkup()}${notificationPromptMarkup()}<div class="workspace"><nav class="sidebar">${nav.map(([key, label]) => `<button class="nav-button ${state.active === key ? "active" : ""}" data-nav="${key}">${label}</button>`).join("")}</nav><main class="content">${sectionContent()}</main></div></div>`;
}

function sectionContent() { return { dashboard: dashboardSection, profile: profileSection, students: studentsSection, dailyAttendance: dailyAttendanceSection, notices: noticesSection, payments: paymentsSection, reports: reportsSection, studentReports: studentReportsSection, gallery: gallerySection, lectures: lecturesSection, ratings: ratingsSection, staff: staffSection }[state.active](); }

function dashboardSection() { 
  return `<section class="section"><h2>Admin Dashboard</h2><div class="grid">
    <div class="stat interactive-card" data-dash-jump="students" style="cursor:pointer;"><span>Total Students</span><strong>${data.students.length}</strong><small class="hint">Click to view class-wise</small></div>
    <div class="stat interactive-card" data-dash-jump="reports" style="cursor:pointer;"><span>Open Reports</span><strong>${data.reports.filter((r) => r.status === "Open").length}</strong><small class="hint">Click to view class-wise</small></div>
    <div class="stat interactive-card" data-dash-jump="lectures" style="cursor:pointer;"><span>Recorded Lectures</span><strong>${data.lectures.length}</strong><small class="hint">Click to view class-wise</small></div>
  </div></section>`; 
}

function profileSection() { const s = currentStudent(); return `<section class="section"><h2>Student Profile</h2><div class="profile-head"><img class="student-photo" src="${s.photo || logoPath}" alt="Student photo"><div><h3>${s.name}</h3><p>Class ${s.className}-${s.section} • Roll ${s.roll}</p></div></div><div class="grid">${stat("Name", s.name)}${stat("ID", s.id)}${stat("Roll", s.roll)}${stat("Class", s.className)}${stat("Section", s.section)}${stat("Mobile Number", s.mobile)}${stat("Father's Name", s.fatherName)}${stat("Mother's Name", s.motherName)}${stat("Address", s.address)}</div></section>`; }
function stat(label, value) { return `<div class="stat"><span>${label}</span><strong>${value || "Not added"}</strong></div>`; }

function studentsSection() {
  const matched = data.students.filter((s) => (!state.search.name || s.name.toLowerCase().includes(state.search.name.toLowerCase())) && (!state.search.className || String(s.className) === state.search.className) && (!state.search.roll || String(s.roll) === state.search.roll) && (!state.search.section || s.section.toLowerCase() === state.search.section.toLowerCase()));
  const groups = {};
  matched.forEach((s) => { const k = "Class " + (s.className || "Unassigned"); if (!groups[k]) groups[k] = []; groups[k].push(s); });
  
  const groupHtml = Object.keys(groups).sort().map((k) => `<div class="class-group"><h3>${k}</h3><div class="table-wrap"><table><thead><tr><th>Photo</th><th>Name</th><th>ID</th><th>Roll</th><th>Class</th><th>Section</th><th>Fee Current Status</th><th>Mobile</th><th>Father</th><th>Mother</th><th>Password</th><th>Actions</th></tr></thead><tbody>${groups[k].map((s) => `<tr><td><img class="thumb" src="${s.photo || logoPath}"></td><td>${s.name}</td><td>${s.id}</td><td>${s.roll}</td><td>${s.className}</td><td>${s.section}</td><td>${feeSummary(s)}</td><td>${s.mobile}</td><td>${s.fatherName}</td><td>${s.motherName}</td><td><code class="password-cell">${escapeAttr(s.password)}</code></td><td><div class="row-actions"><button class="ghost" data-edit-student="${s.id}">Edit Profile</button><button class="danger" data-remove-student="${s.id}">Remove</button></div></td></tr>`).join("")}</tbody></table></div></div>`).join("") || "<p class='hint'>No records found.</p>";
  return `<section class="section"><h2>Student Data</h2><form class="search-panel" data-student-search><input name="name" placeholder="Search name" value="${state.search.name}"><input name="className" placeholder="Class" value="${state.search.className}"><input name="roll" placeholder="Roll" value="${state.search.roll}"><input name="section" placeholder="Section" value="${state.search.section}"><button class="primary">Search</button></form>${editStudentPanel()}${groupHtml}<form class="panel" data-add-student><h2>Add Student</h2><div class="form-row"><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>ID</span><input name="id" required></label></div><div class="form-row"><label class="field"><span>Roll</span><input name="roll" required></label><label class="field"><span>Password</span><input name="password" required></label></div><div class="form-row"><label class="field"><span>Class</span><input name="className" required></label><label class="field"><span>Section</span><input name="section" required></label></div><div class="form-row"><label class="field"><span>Father's Name</span><input name="fatherName" required></label><label class="field"><span>Mother's Name</span><input name="motherName" required></label></div><div class="form-row"><label class="field"><span>Mobile Number</span><input name="mobile" required></label><label class="field"><span>Student Photo</span><input name="photo" type="file" accept="image/*"></label></div><label class="field"><span>Address</span><textarea name="address" required></textarea></label><button class="primary">Add Student</button></form></section>`;
}

function editStudentPanel() {
  const s = data.students.find((student) => student.id === state.editingStudentId);
  if (!s) return "";
  const input = (name, label) => `<label class="field"><span>${label}</span><input name="${name}" value="${escapeAttr(s[name])}" required></label>`;
  return `<form class="panel edit-panel" data-edit-student-form data-student-id="${escapeAttr(s.id)}"><h2>Edit Profile: ${s.name}</h2><p class="hint">Student ID ${s.id}</p><div class="form-row">${input("name", "Name")}${input("roll", "Roll")}</div><div class="form-row">${input("className", "Class")}${input("section", "Section")}</div><div class="form-row">${input("fatherName", "Father's Name")}${input("motherName", "Mother's Name")}</div><div class="form-row">${input("mobile", "Mobile Number")}${input("password", "Password")}</div><div class="form-row"><label class="field"><span>Address</span><textarea name="address" required>${escapeAttr(s.address)}</textarea></label><label class="field"><span>Replace Photo</span><input name="photo" type="file" accept="image/*"></label></div><div class="actions" style="justify-content:flex-start"><button class="primary">Save Changes</button><button class="ghost" type="button" data-cancel-edit>Cancel</button></div></form>`;
}
function dailyAttendanceSection() { 
  const rows = state.role === "admin" ? data.dailyAttendance : data.dailyAttendance.filter((a) => a.studentId === state.user.id);
  const distinctClasses = [...new Set(data.students.map(s => s.className))].sort();
  const selectedClass = state.selectedAttendanceClass || distinctClasses[0] || "";
  const filteredStudentsForDropdown = data.students.filter(s => s.className === selectedClass);

  return `<section class="section"><h2>Everyday Attendance</h2><div class="table-wrap"><table><thead><tr><th>Date</th><th>Student</th><th>ID</th><th>Roll</th><th>Class</th><th>Section</th><th>Status</th></tr></thead><tbody>${rows.map((a) => `<tr><td>${a.date}</td><td>${a.studentName}</td><td>${a.studentId}</td><td>${a.roll || ""}</td><td>${a.className || ""}</td><td>${a.section || ""}</td><td><span class="badge ${a.status === "Present" ? "green" : "red"}">${a.status}</span></td></tr>`).join("") || `<tr><td colspan="7">No records found.</td></tr>`}</tbody></table></div>${state.role === "admin" ? `<form class="panel" data-update-attendance><h2>Update Everyday Attendance</h2><div class="form-row"><label class="field"><span>Select Class Filters</span><select name="filterClass" data-attendance-class-select>${distinctClasses.map(c => `<option value="${c}" ${c === selectedClass ? "selected" : ""}>Class ${c}</option>`).join("")}</select></label><label class="field"><span>Select Class Student</span><select name="studentId">${filteredStudentsForDropdown.map((s) => `<option value="${s.id}">${s.name} (Roll: ${s.roll} • Sec: ${s.section})</option>`).join("")}</select></label></div><div class="form-row"><label class="field"><span>Date</span><input name="date" type="date" value="${today()}" required></label><label class="field"><span>Status</span><select name="status"><option>Present</option><option>Absent</option><option>Late</option></select></label></div><button class="primary">Update Attendance</button></form>` : ""}</section>`; 
}

function noticesSection() { const notices = data.notices.filter((n) => n.language === state.noticeLanguage); return `<section class="section"><h2>Notice Board</h2><div class="notice-tabs"><button class="${state.noticeLanguage === "English" ? "active" : ""}" data-language="English">English</button><button class="${state.noticeLanguage === "Hindi" ? "active" : ""}" data-language="Hindi">Hindi</button></div><div class="list">${notices.map((n) => `<article class="item"><h3>${n.title}</h3><p>${n.body}</p><span class="meta">${n.createdAt}</span></article>`).join("")}</div>${state.role === "admin" ? `<form class="panel" data-add-notice><h2>Add Notice</h2><div class="form-row"><label class="field"><span>Language</span><select name="language"><option>English</option><option>Hindi</option></select></label><label class="field"><span>Title</span><input name="title" required></label></div><label class="field"><span>Notice</span><textarea name="body" required></textarea></label><button class="primary">Add Notice</button></form>` : ""}</section>`; }

function paymentsSection() {
  const students = state.role === "admin" ? data.students : [state.user];
  const rows = [];
  students.forEach((student) => (student.payments || []).forEach((payment, index) => rows.push({ ...payment, student: student.name, studentId: student.id, paymentIndex: index, className: student.className })));
  const classOptions = [...new Set(data.students.map((student) => student.className).filter(Boolean))].sort();
  const selectedClass = state.selectedPaymentClass || classOptions[0] || "";
  const filteredStudents = data.students.filter((student) => String(student.className) === String(selectedClass));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => month + " " + new Date().getFullYear());
  return `<section class="section"><h2>Payment History</h2><div class="table-wrap"><table><thead><tr><th>Class</th><th>Student</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Status</th>${state.role === "admin" ? "<th>Admin Control</th>" : ""}</tr></thead><tbody>${rows.map((payment) => `<tr><td>Class ${payment.className || "-"}</td><td>${payment.student}</td><td>${payment.month}</td><td>Rs. ${payment.amount}</td><td>${payment.dueDate}</td><td><span class="badge ${payment.status === "Paid" ? "green" : "red"}">${payment.status}</span></td>${state.role === "admin" ? `<td>${payment.status === "Due" ? `<button class="secondary" data-toggle-payment="${payment.studentId}|${payment.paymentIndex}|Paid">Mark Paid</button>` : `<button class="ghost" data-toggle-payment="${payment.studentId}|${payment.paymentIndex}|Due">Mark Due</button>`}</td>` : ""}</tr>`).join("")}</tbody></table></div>${state.role === "admin" ? `<form class="panel" data-add-fee><h2>Upload Monthly Fee</h2><div class="form-row"><label class="field"><span>Select Class</span><select name="paymentClass" data-payment-class-select>${classOptions.map((className) => `<option value="${className}" ${String(className) === String(selectedClass) ? "selected" : ""}>Class ${className}</option>`).join("")}</select></label><label class="field"><span>Student</span><select name="studentId">${filteredStudents.map((student) => `<option value="${student.id}">${student.name} (${student.id})</option>`).join("")}</select></label></div><div class="form-row"><label class="field"><span>Month</span><select name="month">${months.map((month) => `<option ${month === monthName() ? "selected" : ""}>${month}</option>`).join("")}</select></label><label class="field"><span>Amount</span><input name="amount" type="number" required></label></div><label class="field"><span>Due Date</span><input name="dueDate" type="date" value="${today()}" required></label><button class="primary">Upload Fee</button></form>` : ""}</section>`;
}
function reportsSection() { 
  const reports = data.reports;
  const groups = {};
  reports.forEach((r) => { const k = "Class " + (r.className || "General"); if (!groups[k]) groups[k] = []; groups[k].push(r); });

  const htmlList = Object.keys(groups).sort().map((k) => `
    <div class="class-group">
      <h3>${k}</h3>
      <div class="list">${groups[k].map((r) => `
        <article class="item"><div class="item-head"><div><h3>${r.staff}</h3><p>${r.issue}</p><span class="meta">Reported by: ${r.studentName} (${r.studentId})</span></div><span class="badge ${r.status === "Resolved" ? "green" : "red"}">${r.status}</span></div>
        ${state.role === "admin" && r.status !== "Resolved" ? `<button class="secondary" data-resolve="${r.id}" style="margin-top:8px;">Mark Resolved</button>` : ""}</article>
      `).join("")}</div>
    </div>
  `).join("") || "<p class='hint'>No staff reports found.</p>";

  return `<section class="section"><h2>Report Staff (Class-Wise Display)</h2>${htmlList}${state.role === "student" ? `<form class="panel" data-add-report><h2>Report an Issue</h2><label class="field"><span>Staff</span><select name="staff">${data.staff.map((s) => `<option>${s.name}</option>`).join("")}</select></label><label class="field"><span>Issue</span><textarea name="issue" required></textarea></label><button class="primary">Submit Report</button></form>` : ""}</section>`; 
}

function studentReportsSection() {
  const reports = state.role === "admin" ? data.studentReports : data.studentReports.filter((r) => r.fromStudentId === state.user.id);
  return `<section class="section"><h2>Report Student</h2><div class="list">${reports.map((report) => `<article class="item"><div class="item-head"><div><h3>Target Student: ${report.againstStudentName} (Class: ${report.againstClassName} • Roll: ${report.againstRoll} • Sec: ${report.againstSection})</h3><p>Issue: ${report.issue}</p><span class="meta">Reported by ${report.fromStudentName} on ${report.date}</span></div><span class="badge ${report.status === "Resolved" ? "green" : "red"}">${report.status}</span></div>${state.role === "admin" && report.status !== "Resolved" ? `<button class="secondary" data-resolve-student-report="${report.id}">Mark Resolved</button>` : ""}</article>`).join("") || "<p class='hint'>No reports found.</p>"}</div>
  ${state.role === "student" ? `<form class="panel" data-add-student-report><h2>Complaint Against Student</h2>
    <div class="form-row"><label class="field"><span>Student Name</span><input name="againstStudentName" placeholder="Enter full name" required></label><label class="field"><span>Class</span><input name="againstClassName" placeholder="e.g. 10" required></label></div>
    <div class="form-row"><label class="field"><span>Roll No</span><input name="againstRoll" placeholder="e.g. 05" required></label><label class="field"><span>Section</span><input name="againstSection" placeholder="e.g. A" required></label></div>
    <label class="field"><span>Complaint Context</span><textarea name="issue" required></textarea></label><button class="primary">Send Complaint to Admin</button></form>` : ""}</section>`;
}

function visibleGalleryItems() {
  if (state.role === "admin") return data.gallery;
  return data.gallery.filter((item) => item.className === "All" || String(item.className) === String(state.user.className));
}
function gallerySection() {
  const items = visibleGalleryItems();
  const groups = {};
  items.forEach((item) => { const key = item.className === "All" ? "All Class" : "Class " + item.className; if (!groups[key]) groups[key] = []; groups[key].push(item); });
  const classOptions = ["All"].concat([...new Set(data.students.map((student) => student.className).filter(Boolean))].sort());
  const html = Object.keys(groups).sort().map((key) => `<div class="class-group"><h3>${key}</h3><div class="gallery-grid">${groups[key].map(galleryCard).join("")}</div></div>`).join("") || "<p class='hint'>No gallery items available.</p>";
  return `<section class="section"><h2>Class Gallery</h2>${html}${state.role === "admin" ? `<form class="panel" data-add-gallery><h2>Upload Photo or Video</h2><label class="field"><span>Class</span><select name="className">${classOptions.map((className) => `<option value="${className}">${className === "All" ? "All Class" : "Class " + className}</option>`).join("")}</select></label><label class="field"><span>Title</span><input name="title" placeholder="Optional"></label><label class="field"><span>Photo or Video</span><input name="media" type="file" accept="image/*,video/*" required></label><button class="primary">Upload to Gallery</button></form>` : ""}</section>`;
}
function galleryCard(item) {
  const isVideo = item.type.indexOf("video") === 0;
  const title = item.title || "Gallery Media";
  const menu = state.openGalleryMenu === item.id ? `<div class="gallery-menu"><a href="${item.url}" download="${title}.png">Download</a></div>` : "";
  const media = isVideo ? `<button class="gallery-photo-button" data-gallery-fullscreen="${item.id}"><video muted preload="metadata" src="${item.url}"></video></button>` : `<button class="gallery-photo-button" data-gallery-fullscreen="${item.id}"><img src="${item.url}" alt="${title}"></button><button class="dots-button" data-gallery-menu="${item.id}" aria-label="Photo options">⋮</button>${menu}`;
  return `<article class="gallery-card"><h3>${title}</h3>${media}</article>`;
}
function lecturesSection() { 
  const lectures = state.role === "admin" ? data.lectures : data.lectures.filter((l) => l.className === "All" || String(l.className) === String(state.user.className)); 
  const groups = {};
  lectures.forEach((l) => { const k = "Class " + l.className; if (!groups[k]) groups[k] = []; groups[k].push(l); });
  const html = Object.keys(groups).sort().map((key) => `<div class="class-group"><h3>${key}</h3><div class="list">${groups[key].map((lecture) => `<article class="item"><div class="lecture-row"><span class="video-icon" aria-hidden="true"></span><div class="lecture-main"><h3>${lecture.title}</h3><p>${lecture.teacher} - ${lecture.fileName || "Lecture File"}</p>${lecture.url ? `<video id="video-${lecture.id}" class="${lecture.size === "max" ? "video-max" : lecture.size === "min" ? "video-min" : ""}" controls preload="metadata" src="${lecture.url}"></video><div class="video-actions"><button class="ghost" data-minimize-video="${lecture.id}">Minimize</button><button class="ghost" data-maximize-video="${lecture.id}">Maximize</button><button class="ghost" data-fullscreen-video="${lecture.id}">Full Screen</button></div>` : "<span class='meta'>Video attached successfully.</span>"}</div>${state.role === "admin" ? `<button class="danger" data-remove-lecture="${lecture.id}">Remove</button>` : ""}</div></article>`).join("")}</div></div>`).join("") || "<p class='hint'>No lectures available.</p>"; 
  return `<section class="section"><h2>Recorded Lectures</h2><p class="hint">Arranged by Class. Use view customization rules anytime.</p>${html}${state.role === "admin" ? `<form class="panel" data-add-lecture><h2>Upload Long MP4 Lecture (Class-Wise Only)</h2><div class="form-row"><label class="field"><span>Title</span><input name="title" required></label><label class="field"><span>Teacher</span><input name="teacher" required></label></div><label class="field"><span>Class</span><input name="className" placeholder="e.g. 12" required></label><label class="field"><span>MP4 Video File</span><input name="video" type="file" accept="video/mp4" required></label><button class="primary">Upload Lecture</button></form>` : ""}</section>`; 
}

function nextRatingCountdown() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + (7 - now.getDay()));
  next.setHours(0, 0, 0, 0);
  const diff = Math.max(0, next - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return days + " days " + hours + " hours " + minutes + " minutes";
}
function ratingsSection() {
  const teachers = data.staff.filter((staff) => staff.role === "Teacher");
  const currentRating = state.role === "student" ? data.ratings.find((rating) => rating.studentId === state.user.id && rating.week === weekKey()) : null;
  return `<section class="section"><h2>Teacher Ratings</h2>${state.role === "student" ? (currentRating ? `<div class="panel"><h2>Weekly Feedback Registered</h2><p class="hint">${currentRating.teacher}: ${currentRating.score} Star - ${ratingLabel(currentRating.score)}</p><div class="stat countdown"><span>Next rating opens in</span><strong>${nextRatingCountdown()}</strong></div></div>` : `<form class="panel" data-add-rating><h2>Rate This Week</h2><label class="field"><span>Select Teacher</span><select name="teacher">${teachers.map((teacher) => `<option>${teacher.name}</option>`).join("")}</select></label><input type="hidden" name="score" value="5"><div class="rating-row">${[1, 2, 3, 4, 5].map((score) => `<button type="button" class="star active" data-star="${score}">${score} ★</button>`).join("")}</div><div id="star-hint" class="hint"><strong>Excellent</strong></div><button class="primary">Submit Performance Score</button></form>`) : ""}<div class="table-wrap"><table><thead><tr><th>Teacher Name</th><th>Evaluated By</th><th>Week Key</th><th>Submission Month</th><th>Rating Level</th></tr></thead><tbody>${(state.role === "admin" ? data.ratings : data.ratings.filter((rating) => rating.studentId === state.user.id)).map((rating) => `<tr><td>${rating.teacher}</td><td>${rating.studentName || rating.studentId}</td><td>${rating.week}</td><td>${rating.month}</td><td><span class="badge green">${rating.score} Star (${ratingLabel(rating.score)})</span></td></tr>`).join("")}</tbody></table></div></section>`;
}
function staffSection() { return `<section class="section"><h2>Add Staff and Role</h2><div class="table-wrap"><table><thead><tr><th>Name</th><th>Subject/Work</th><th>Role</th><th></th></tr></thead><tbody>${data.staff.map((staff) => `<tr><td>${staff.name}</td><td>${staff.subject}</td><td><span class="badge">${staff.role}</span></td><td><button class="danger" data-remove-staff="${staff.id}">Remove</button></td></tr>`).join("")}</tbody></table></div><form class="panel" data-add-staff><h2>Add Staff</h2><div class="form-row"><label class="field"><span>Staff Name</span><input name="name" required></label><label class="field"><span>Subject or Work</span><input name="subject" required></label></div><label class="field"><span>Role</span><select name="role"><option>Teacher</option><option>Admin</option><option>Support Staff</option><option>Accountant</option></select></label><button class="primary">Add Staff</button></form></section>`; }
function goodbyePage() { return `<main class="goodbye"><section><img class="goodbye-logo" src="${logoPath}" alt="Seminary Classes logo"><h1>Thanks for Connecting with seminary classes</h1><button class="primary" data-go-login>Login Again</button></section></main>`; }

function bindEvents() {
  on("[data-go-login]", "click", () => { state.screen = "login"; render(); });
  on("[data-back-home]", "click", () => { state.screen = "greeting"; render(); });
  on("[data-login-form]", "submit", handleLogin);
  on("[data-logout]", "click", logout);
  on("[data-install-app]", "click", promptInstallApp);
  on("[data-enable-notifications]", "click", enableNotifications);
  on("[data-student-search]", "submit", searchStudents);
  on("[data-add-student]", "submit", addStudent);
  on("[data-update-attendance]", "submit", updateAttendance);
  on("[data-add-notice]", "submit", addNotice);
  on("[data-add-fee]", "submit", addFee);
  on("[data-add-report]", "submit", addReport);
  on("[data-add-student-report]", "submit", addStudentReport);
  on("[data-add-gallery]", "submit", addGalleryItem);
  on("[data-add-lecture]", "submit", addLecture);
  on("[data-add-rating]", "submit", addRating);
  on("[data-add-staff]", "submit", addStaff);
  on("[data-edit-student-form]", "submit", saveStudentProfile);
  on("[data-cancel-edit]", "click", () => { state.editingStudentId = null; render(); });
  on("[data-toggle-password]", "click", (e) => { const button = e.currentTarget; const field = button.parentElement.querySelector("input"); const show = field.type === "password"; field.type = show ? "text" : "password"; button.innerHTML = eyeIcon(show); button.setAttribute("aria-label", show ? "Hide password" : "Show password"); button.setAttribute("aria-pressed", String(show)); field.focus(); });
  $$("[data-edit-student]").forEach((b) => b.addEventListener("click", () => { state.editingStudentId = b.dataset.editStudent; render(); const panel = $("[data-edit-student-form]"); if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  
  $$("[data-dash-jump]").forEach((card) => card.addEventListener("click", () => { state.active = card.dataset.dashJump; render(); }));
  const attClassSel = $("[data-attendance-class-select]");
  if (attClassSel) { attClassSel.addEventListener("change", (e) => { state.selectedAttendanceClass = e.target.value; render(); }); }
  const payClassSel = $("[data-payment-class-select]");
  if (payClassSel) { payClassSel.addEventListener("change", (e) => { state.selectedPaymentClass = e.target.value; render(); }); }

  $$('[data-nav]').forEach((b) => b.addEventListener("click", () => { state.active = b.dataset.nav; render(); }));
  $$('[data-language]').forEach((b) => b.addEventListener("click", () => { state.noticeLanguage = b.dataset.language; render(); }));
  $$("[data-gallery-menu]").forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); state.openGalleryMenu = state.openGalleryMenu === b.dataset.galleryMenu ? null : b.dataset.galleryMenu; render(); }));
  $$("[data-gallery-fullscreen]").forEach((b) => b.addEventListener("click", () => openGalleryFullscreen(b.dataset.galleryFullscreen)));
  $$('[data-resolve]').forEach((b) => b.addEventListener("click", () => { data.reports = data.reports.map((r) => r.id === b.dataset.resolve ? { ...r, status: "Resolved" } : r); saveData(); render(); }));
  $$("[data-resolve-student-report]").forEach((b) => b.addEventListener("click", () => { data.studentReports = data.studentReports.map((r) => r.id === b.dataset.resolveStudentReport ? { ...r, status: "Resolved" } : r); saveData(); render(); }));
  $$("[data-toggle-payment]").forEach((b) => b.addEventListener("click", () => { const parts = b.dataset.togglePayment.split("|"); const target = data.students.find((s) => s.id === parts[0]); if (target && target.payments[parts[1]]) { target.payments[parts[1]].status = parts[2]; saveData(); render(); } }));
  $$('[data-remove-student]').forEach((b) => b.addEventListener("click", () => { data.students = data.students.filter((s) => s.id !== b.dataset.removeStudent); if (state.editingStudentId === b.dataset.removeStudent) state.editingStudentId = null; saveData(); render(); }));
  $$('[data-remove-lecture]').forEach((b) => b.addEventListener("click", () => { data.lectures = data.lectures.filter((l) => l.id !== b.dataset.removeLecture); saveData(); render(); }));
  $$('[data-remove-staff]').forEach((b) => b.addEventListener("click", () => { data.staff = data.staff.filter((staff) => staff.id !== b.dataset.removeStaff); saveData(); render(); }));
  $$('[data-fullscreen-video]').forEach((b) => b.addEventListener("click", () => { const v = document.getElementById("video-" + b.dataset.fullscreenVideo); if (v && v.requestFullscreen) v.requestFullscreen(); }));
  $$("[data-gallery-fullscreen]").forEach((b) => b.addEventListener("click", () => openGalleryFullscreen(b.dataset.galleryFullscreen)));
  $$("[data-minimize-video]").forEach((b) => b.addEventListener("click", () => { data.lectures = data.lectures.map((l) => l.id === b.dataset.minimizeVideo ? { ...l, size: "min" } : l); saveData(); render(); }));
  $$("[data-maximize-video]").forEach((b) => b.addEventListener("click", () => { data.lectures = data.lectures.map((l) => l.id === b.dataset.maximizeVideo ? { ...l, size: "max" } : l); saveData(); render(); }));
  $$('[data-star]').forEach((b) => b.addEventListener("click", () => { const score = Number(b.dataset.star); $("input[name='score']").value = score; $("#star-hint").textContent = ratingLabel(score); $$('[data-star]').forEach((s) => s.classList.toggle("active", Number(s.dataset.star) <= score)); }));
}

function openGalleryFullscreen(id) {
  const items = visibleGalleryItems();
  const index = Math.max(0, items.findIndex((entry) => entry.id === id));
  renderGalleryViewer(items, index);
}
function renderGalleryViewer(items, index) {
  const item = items[index];
  if (!item) return;
  document.querySelectorAll(".gallery-overlay").forEach((overlay) => overlay.remove());
  const title = item.title || "Gallery Media";
  const isVideo = item.type.indexOf("video") === 0;
  const overlay = document.createElement("div");
  overlay.className = "gallery-overlay";
  overlay.innerHTML = `<button class="edge-close" data-gallery-close>Close Full Screen</button><div class="gallery-stage">${isVideo ? `<video controls autoplay src="${item.url}"></video>` : `<img class="zoomable-photo" draggable="false" data-zoom="1" src="${item.url}" alt="${title}">`}</div><div class="gallery-counter">${index + 1} / ${items.length}</div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("[data-gallery-close]").addEventListener("click", () => overlay.remove());

  const image = overlay.querySelector(".zoomable-photo");
  const showNext = () => items.length > 1 && renderGalleryViewer(items, (index + 1) % items.length);
  const showPrevious = () => items.length > 1 && renderGalleryViewer(items, (index - 1 + items.length) % items.length);
  const applyZoom = (next) => {
    if (!image) return;
    const zoom = Math.max(1, Math.min(5, next));
    image.dataset.zoom = String(zoom);
    image.style.transform = "scale(" + zoom + ")";
  };

  if (image) {
    image.addEventListener("dragstart", (event) => event.preventDefault());
    image.addEventListener("wheel", (event) => {
      event.preventDefault();
      applyZoom(Number(image.dataset.zoom || "1") + (event.deltaY < 0 ? 0.25 : -0.25));
    }, { passive: false });
    image.addEventListener("dblclick", () => {
      const current = Number(image.dataset.zoom || "1");
      applyZoom(current > 1 ? 1 : 2.25);
    });
  }

  let startX = 0;
  let startY = 0;
  let mouseDown = false;
  let pinchStartDistance = 0;

  const swipeEnd = (endX, endY) => {
    const dx = endX - startX;
    const dy = endY - startY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? showNext() : showPrevious();
    }
  };

  overlay.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    mouseDown = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  overlay.addEventListener("mouseup", (event) => {
    if (!mouseDown) return;
    mouseDown = false;
    swipeEnd(event.clientX, event.clientY);
  });
  overlay.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    if (event.touches.length === 2) {
      pinchStartDistance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
    }
  }, { passive: true });
  overlay.addEventListener("touchmove", (event) => {
    if (!image || event.touches.length !== 2 || !pinchStartDistance) return;
    const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
    applyZoom(Number(image.dataset.zoom || "1") + (distance - pinchStartDistance) / 180);
    pinchStartDistance = distance;
  }, { passive: true });
  overlay.addEventListener("touchend", (event) => {
    if (pinchStartDistance) { pinchStartDistance = 0; return; }
    const touch = event.changedTouches[0];
    swipeEnd(touch.clientX, touch.clientY);
  }, { passive: true });
}
function handleLogin(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const role = f.get("role"); const id = String(f.get("id")).trim(); const user = role === "admin" ? data.admin : data.students.find((s) => s.id === id); if (!user || user.id !== id || user.password !== String(f.get("password"))) { $("[data-login-error]").textContent = "Invalid credentials entered."; return; } state = { ...createDefaultState(), screen: "main", role, user, active: role === "admin" ? "dashboard" : "profile", selectedAttendanceClass: user.className || "", selectedPaymentClass: user.className || "" }; saveSession(role, user); render(); }
function logout() { const nextScreen = state.role === "student" ? "goodbye" : "login"; clearSession(); state = { ...createDefaultState(), screen: nextScreen }; render(); }
function searchStudents(e) { e.preventDefault(); const f = new FormData(e.currentTarget); state.search = { name: String(f.get("name") || ""), className: String(f.get("className") || ""), roll: String(f.get("roll") || ""), section: String(f.get("section") || "") }; render(); }
async function addStudent(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const file = e.currentTarget.querySelector('input[name="photo"]').files[0]; const photo = await fileToDataUrl(file); data.students.push({ id: f.get("id"), roll: f.get("roll"), password: f.get("password"), name: f.get("name"), fatherName: f.get("fatherName"), motherName: f.get("motherName"), className: f.get("className"), section: f.get("section"), mobile: f.get("mobile"), address: f.get("address"), photo, attendance: 0, payments: [] }); saveData(); render(); }
async function saveStudentProfile(e) { e.preventDefault(); const form = e.currentTarget; const s = data.students.find((student) => student.id === form.dataset.studentId); if (!s) return; const f = new FormData(form); ["name", "roll", "className", "section", "fatherName", "motherName", "mobile", "password", "address"].forEach((key) => { s[key] = String(f.get(key) || "").trim(); }); const file = form.querySelector('input[name="photo"]').files[0]; if (file) s.photo = await fileToDataUrl(file); state.editingStudentId = null; saveData(); render(); }
function updateAttendance(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const s = data.students.find((student) => student.id === f.get("studentId")); if (!s) return; data.dailyAttendance = data.dailyAttendance.filter((a) => !(a.studentId === s.id && a.date === f.get("date"))); data.dailyAttendance.push({ id: uid("DA"), date: f.get("date"), studentId: s.id, studentName: s.name, className: s.className, section: s.section, roll: s.roll, status: f.get("status") }); saveData(); render(); }
// Sends the notice to OUR OWN backend endpoint, which holds the OneSignal
// REST API Key server-side and forwards the actual send request to
// OneSignal's API. The key must never be called directly from this file —
// see netlify/functions/send-notification.js for a ready-to-deploy example
// of that endpoint.
async function sendNoticePush(notice) {
  try {
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: notice.title || "New Notice Posted",
        body: notice.body || "A new notice has been posted on the notice board.",
        url: "/",
        data: { noticeId: notice.id }
      })
    });
    if (!response.ok) {
      console.error("Notice push request failed:", response.status);
    }
  } catch (error) {
    console.error("Notice push request errored:", error);
  }
}

function addNotice(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const notice = { id: uid("N"), language: f.get("language"), title: f.get("title"), body: f.get("body"), createdAt: today() }; data.notices.push(notice); saveData(); render(); sendNotification(notice.title || "New Notice Posted", { body: notice.body || "A new notice has been posted on the notice board.", tag: notice.id, data: { url: "/", noticeId: notice.id } }); sendNoticePush(notice); }
function addFee(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const s = data.students.find((student) => student.id === f.get("studentId")); if (!s) return; s.payments.push({ month: f.get("month"), amount: Number(f.get("amount")), dueDate: f.get("dueDate"), status: "Due" }); saveData(); render(); }
function addReport(e) { e.preventDefault(); const f = new FormData(e.currentTarget); data.reports.push({ id: uid("R"), studentId: state.user.id, studentName: state.user.name, staff: f.get("staff"), issue: f.get("issue"), status: "Open", className: state.user.className }); saveData(); render(); }
function addStudentReport(e) { e.preventDefault(); const f = new FormData(e.currentTarget); data.studentReports.push({ id: uid("SR"), fromStudentId: state.user.id, fromStudentName: state.user.name, againstStudentName: f.get("againstStudentName"), againstClassName: f.get("againstClassName"), againstRoll: f.get("againstRoll"), againstSection: f.get("againstSection"), issue: f.get("issue"), status: "Open", date: today() }); saveData(); render(); }
async function addGalleryItem(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const file = e.currentTarget.querySelector("input[name=media]").files[0]; if (!file) return; const isVideo = file.type.indexOf("video") === 0; const url = isVideo ? URL.createObjectURL(file) : await fileToDataUrl(file); data.gallery.push({ id: uid("G"), title: f.get("title") || "Gallery Media", className: f.get("className"), type: file.type, fileName: "", url, date: today() }); saveData(); render(); }
function addLecture(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const file = e.currentTarget.querySelector('input[type="file"]').files[0]; data.lectures.push({ id: uid("L"), title: f.get("title"), teacher: f.get("teacher"), className: f.get("className"), fileName: file ? file.name : "lecture.mp4", url: file ? URL.createObjectURL(file) : "", type: "mp4", size: "normal" }); saveData(); render(); }
function addStaff(e) { e.preventDefault(); const f = new FormData(e.currentTarget); data.staff.push({ id: uid("S"), name: f.get("name"), subject: f.get("subject"), role: f.get("role") }); saveData(); render(); }
function addRating(e) { e.preventDefault(); if (data.ratings.find((r) => r.studentId === state.user.id && r.week === weekKey())) return; const f = new FormData(e.currentTarget); data.ratings.push({ id: uid("RT"), studentId: state.user.id, studentName: state.user.name, teacher: f.get("teacher"), week: weekKey(), month: monthName(), score: Number(f.get("score")) }); saveData(); render(); }

document.addEventListener("DOMContentLoaded", () => {
  data = normalize(loadData());
  restoreSession();
  saveData();
  render();
});
