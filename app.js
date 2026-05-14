// ---- ClanHub Central Application Logic & Firebase Manager ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPhoneNumber, RecaptchaVerifier, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUM-UWPTMi_lVSOROrzkkp5ceZrh67Ev0",
  authDomain: "clanhub-82f8c.firebaseapp.com",
  databaseURL: "https://clanhub-82f8c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clanhub-82f8c",
  storageBucket: "clanhub-82f8c.firebasestorage.app",
  messagingSenderId: "690675796813",
  appId: "1:690675796813:web:9cbafb424391ef258a8504"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const formatEmail = (username) => username.includes('@') ? username : `${username.trim()}@clanhub.com`;

function getBasePath() {
  const loc = window.location;
  // This helps GitHub Pages handle the subfolder /ClanHub/ correctly
  return loc.origin + loc.pathname.substring(0, loc.pathname.lastIndexOf('/')) + '/';
}

/* ========================================================
   🔑 AUTHENTICATION LOGIC
======================================================== */
window.login = async function() {
  const msg = document.getElementById("msg");
  const userInp = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!userInp || !pass) {
    msg.innerText = "Please complete all fields.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, formatEmail(userInp), pass);
    // Success redirect is handled by onAuthStateChanged below
  } catch (error) {
    msg.innerText = "Login failed: " + error.message;
  }
}

/* ========================================================
   💾 REGISTRATION & OTP
======================================================== */
window.sendOTP = async function() {
  const phone = document.getElementById("reg-contact").value.trim();
  const msg = document.getElementById("msg");

  if(!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
  }
  
  try {
    window.confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    msg.innerText = "OTP Sent!";
    msg.style.color = "lime";
  } catch (error) {
    msg.innerText = "Error: " + error.message;
  }
}

window.handleRegister = async function() {
  const msg = document.getElementById("msg");
  const userInp = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const name = document.getElementById("reg-name").value;
  const otp = document.getElementById("reg-otp").value;

  try {
    const phoneResult = await window.confirmationResult.confirm(otp);
    const authResult = await createUserWithEmailAndPassword(auth, formatEmail(userInp), pass);

    await setDoc(doc(db, "users", authResult.user.uid), {
      username: userInp,
      name: name,
      phone: phoneResult.user.phoneNumber,
      uid: authResult.user.uid,
      created_at: new Date()
    });
  } catch (err) {
    msg.innerText = "Error: " + err.message;
  }
}

/* ========================================================
   🌐 DYNAMIC NAVBAR
======================================================== */
window.logout = function() {
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.href = getBasePath() + "login.html";
  });
}

window.loadNavbar = function(activeTab) {
  if (document.querySelector('.bottom-nav')) return;
  const base = getBasePath();
  const navHTML = `
    <nav class="bottom-nav">
      <a href="${base}index.html" class="nav-item ${activeTab === 'home' ? 'active' : ''}">
        <span class="nav-icon">🏠</span><span>Home</span>
      </a>
      <a href="${base}map.html" class="nav-item ${activeTab === 'map' ? 'active' : ''}">
        <span class="nav-icon">🗺️</span><span>Radar</span>
      </a>
      <a href="${base}chat.html" class="nav-item ${activeTab === 'chat' ? 'active' : ''}">
        <span class="nav-icon">💬</span><span>Chat</span>
      </a>
      <a href="${base}profile.html" class="nav-item ${activeTab === 'profile' ? 'active' : ''}">
        <span class="nav-icon">👤</span><span>Profile</span>
      </a>
    </nav>`;
  document.body.insertAdjacentHTML('beforeend', navHTML);
}
/* ========================================================
   🛡️ AUTH OBSERVER (STRICT ENFORCEMENT)
======================================================== */
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    // Improved GitHub Pages path detection
    const isLoginPage = page === "login.html";
    const isRoot = page === "" || page === "index.html" || path.endsWith('/ClanHub/');

    if (!user) {
        // FORCE redirect if not logged in and not on login page
        if (!isLoginPage) {
            console.log("No user detected. Redirecting to login...");
            window.location.replace(getBasePath() + "login.html");
        }
    } else {
        console.log("User authenticated:", user.uid);
        
        // If logged in but on login page, go to home
        if (isLoginPage) {
            window.location.replace(getBasePath() + "index.html");
        }

        // 1. Load Navbar First
        const routes = {
  "index.html": "home",
  "map.html": "map",
  "chat.html": "chat",
  "profile.html": "profile"
};

const currentTab = routes[page] || (isRoot ? "home" : null);

if (currentTab) {
  window.loadNavbar(currentTab);
}
        // 2. Fetch and Fill User Data
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const nameEl = document.getElementById("user-full-name");
                const idEl = document.getElementById("user-member-id");
                
                if (nameEl) nameEl.innerText = userData.name || "User";
                if (idEl) idEl.innerText = "@" + (userData.username || "member");
            }
        } catch (e) {
            console.error("Error fetching user data:", e);
        }
    }

});