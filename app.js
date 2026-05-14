// ---- ClanHub Central Application Logic & Firebase Manager ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
  const path = loc.pathname;
  const base = path.substring(0, path.lastIndexOf('/') + 1);
  return loc.origin + base;
}

/* ========================================================
   🚀 NAV LOADER (ANTI-BLINK LOGIC)
======================================================== */
function applyActiveClass() {
    const currentURL = window.location.href.toLowerCase();
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (currentURL.includes('profile')) {
        document.getElementById('nav-profile')?.classList.add('active');
    } else if (currentURL.includes('map')) {
        document.getElementById('nav-map')?.classList.add('active');
    } else if (currentURL.includes('chat')) {
        document.getElementById('nav-chat')?.classList.add('active');
    } else if (currentURL.includes('index') || currentURL.endsWith('/') || currentURL.endsWith('clanhub')) {
        document.getElementById('nav-home')?.classList.add('active');
    }
}

async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    // 1. Instant Load from Cache
    const cachedNav = localStorage.getItem('nav_cache');
    if (cachedNav) {
        placeholder.innerHTML = cachedNav;
        applyActiveClass();
    }

    // 2. Background Fetch (Silent Update)
    try {
        const base = getBasePath();
        const response = await fetch(base + 'nav.html');
        if (response.ok) {
            const freshNav = await response.text();
            
            // Only update DOM if cache is missing or different to prevent a second "blink"
            if (freshNav !== cachedNav) {
                localStorage.setItem('nav_cache', freshNav);
                placeholder.innerHTML = freshNav;
                applyActiveClass();
            }
        }
    } catch (err) {
        console.error("Nav Fetch Error:", err);
    }
}

/* ========================================================
   🔑 AUTHENTICATION & OBSERVER
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
  } catch (error) {
    msg.innerText = "Login failed: " + error.message;
  }
}

window.logout = function() {
  auth.signOut().then(() => {
    localStorage.clear();
    window.location.href = getBasePath() + "login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes("login.html");

    if (!user) {
        if (!isLoginPage) window.location.replace(getBasePath() + "login.html");
    } else {
        if (isLoginPage) {
            window.location.replace(getBasePath() + "index.html");
            return;
        }

        // Start Navbar Injection Immediately
        injectNavbar();

        // Sync UI Data
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const nameEl = document.getElementById("user-full-name");
                const idEl = document.getElementById("user-member-id");
                if (nameEl) nameEl.innerText = userData.name || "User";
                if (idEl) idEl.innerText = "@" + (userData.username || "member");
            }
        } catch (e) {
            console.error("UI Sync Error:", e);
        }
    }
});