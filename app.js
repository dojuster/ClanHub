// ---- ClanHub Central Application Logic & Firebase Manager ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPhoneNumber, RecaptchaVerifier 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUM-UWPTMi_lVSOROrzkkp5ceZrh67Ev0",
  authDomain: "clanhub-82f8c.firebaseapp.com",
  databaseURL: "https://clanhub-82f8c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clanhub-82f8c",
  storageBucket: "clanhub-82f8c.firebasestorage.app",
  messagingSenderId: "690675796813",
  appId: "1:690675796813:web:9cbafb424391ef258a8504",
  measurementId: "G-BSRLFBJ4GH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

function getBasePath() {
  const loc = window.location;
  return loc.protocol + '//' + loc.host + loc.pathname.substring(0, loc.pathname.lastIndexOf('/')) + '/';
}

/* ========================================================
   🔑 SECURE AUTHENTICATION SYSTEM (FIREBASE)
======================================================== */
window.login = async function() {
  const msg = document.getElementById("msg");
  const email = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!email || !pass) {
    msg.innerText = "Please complete all login fields.";
    msg.style.color = "#f87171";
    return;
  }

  // Bypass for testing
  if (email === "admin" && pass === "1234") {
    handleSessionMapping("admin");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    handleSessionMapping(userCredential.user.email);
  } catch (error) {
    msg.innerText = "Login failed: " + error.message;
    msg.style.color = "#f87171";
  }
}

function handleSessionMapping(username) {
  let sessions = JSON.parse(localStorage.getItem("active_sessions")) || [];
  if (!sessions.includes(username)) { sessions.push(username); }
  localStorage.setItem("active_sessions", JSON.stringify(sessions));
  localStorage.setItem("user", username);
  window.location.href = getBasePath() + "index.html";
}

/* ========================================================
   💾 FIREBASE REGISTRATION & OTP HANDLER
======================================================== */
window.sendOTP = async function() {
  const phone = document.getElementById("reg-contact").value;
  const msg = document.getElementById("msg");

  // ReCAPTCHA is required for Phone Auth security
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
  
  try {
    window.confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    msg.innerText = "OTP Sent!";
    msg.style.color = "lime";
  } catch (error) {
    msg.innerText = "SMS Error: " + error.message;
    msg.style.color = "#f87171";
  }
}

window.handleRegister = async function() {
  const msg = document.getElementById("msg");
  const email = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const name = document.getElementById("reg-name").value;
  const otp = document.getElementById("reg-otp").value;

  try {
    // 1. Verify OTP first
    const phoneResult = await window.confirmationResult.confirm(otp);
    const verifiedUser = phoneResult.user;

    // 2. Create the Email Account
    const emailResult = await createUserWithEmailAndPassword(auth, email, pass);
    const finalUser = emailResult.user;

    // 3. Save combined profile to Firestore
    await setDoc(doc(db, "users", finalUser.uid), {
      name: name,
      email: email,
      phone: verifiedUser.phoneNumber,
      uid: finalUser.uid,
      role: "member",
      created_at: new Date()
    });

    msg.innerText = "Registration Success!";
    msg.style.color = "lime";
    setTimeout(() => { handleSessionMapping(email); }, 1500);
  } catch (err) {
    msg.innerText = "Error: " + err.message;
    msg.style.color = "#f87171";
  }
}

/* ========================================================
   🚪 NAVIGATION & LOGOUT
======================================================== */
window.logout = function() {
  auth.signOut().then(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("active_sessions");
    window.location.href = getBasePath() + "login.html";
  });
}

window.loadNavbar = function(activeTab) {
  const base = getBasePath();
  const navHTML = `
    <nav class="bottom-nav">
      <a href="${base}index.html" class="nav-item ${activeTab === 'home' ? 'active' : ''}"><span>🏠 Home</span></a>
      <a href="${base}map.html" class="nav-item ${activeTab === 'map' ? 'active' : ''}"><span>🗺️ Radar</span></a>
      <a href="${base}chat.html" class="nav-item ${activeTab === 'chat' ? 'active' : ''}"><span>💬 Chat</span></a>
      <a href="${base}profile.html" class="nav-item ${activeTab === 'profile' ? 'active' : ''}"><span>👤 Profile</span></a>
    </nav>
  `;
  document.body.insertAdjacentHTML('beforeend', navHTML);
}