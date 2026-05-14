// ---- ClanHub Central Application Logic & Firebase Manager ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ========================================================
   🔧 FIREBASE CONFIG
======================================================== */
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

/* ========================================================
   🔗 HELPERS
======================================================== */
const formatEmail = (username) =>
  username.includes('@') ? username : `${username.trim()}@clanhub.com`;

function getBasePath() {
  const loc = window.location;
  const path = loc.pathname;
  return loc.origin + path.substring(0, path.lastIndexOf('/') + 1);
}

/* ========================================================
   🚀 NAVBAR SYSTEM (NO BLINK)
======================================================== */

// Highlight active tab
function applyActiveClass() {
  const url = window.location.href.toLowerCase();

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
  });

  if (url.includes('profile')) {
    document.getElementById('nav-profile')?.classList.add('active');
  } else if (url.includes('map')) {
    document.getElementById('nav-map')?.classList.add('active');
  } else if (url.includes('chat')) {
    document.getElementById('nav-chat')?.classList.add('active');
  } else {
    document.getElementById('nav-home')?.classList.add('active');
  }
}

// Inject navbar (optimized)
async function injectNavbar() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const cachedNav = localStorage.getItem('nav_cache');

  // ✅ 1. INSTANT LOAD (no blink)
  if (cachedNav && !placeholder.innerHTML.trim()) {
    placeholder.innerHTML = cachedNav;
    applyActiveClass();
  }

  // 🔄 2. BACKGROUND UPDATE (safe, no flicker)
  try {
    const res = await fetch(getBasePath() + 'nav.html');
    if (!res.ok) return;

    const freshNav = await res.text();

    // Only update cache if changed
    if (freshNav !== cachedNav) {
      localStorage.setItem('nav_cache', freshNav);

      // ⚡ Update ONLY if nothing rendered yet (prevents flicker)
      if (!cachedNav) {
        placeholder.innerHTML = freshNav;
        applyActiveClass();
      }
    }
  } catch (err) {
    console.error("Navbar load error:", err);
  }
}

/* ========================================================
   🔑 AUTH SYSTEM
======================================================== */

window.login = async function () {
  const msg = document.getElementById("msg");
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!user || !pass) {
    msg.innerText = "Please complete all fields.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, formatEmail(user), pass);
  } catch (err) {
    msg.innerText = "Login failed: " + err.message;
  }
};

window.logout = function () {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = getBasePath() + "login.html";
  });
};

/* ========================================================
   🧠 LOAD NAVBAR IMMEDIATELY (CRITICAL FIX)
======================================================== */

// 🚀 THIS LINE FIXES BLINK
injectNavbar();

/* ========================================================
   🛡️ AUTH OBSERVER
======================================================== */

onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  const isLogin = path.includes("login.html");

  if (!user) {
    if (!isLogin) {
      window.location.replace(getBasePath() + "login.html");
    }
    return;
  }

  if (isLogin) {
    window.location.replace(getBasePath() + "index.html");
    return;
  }

  // 🔄 Sync user data (NO NAVBAR HERE)
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();

      const nameEl = document.getElementById("user-full-name");
      const idEl = document.getElementById("user-member-id");

      if (nameEl) nameEl.innerText = data.name || "User";
      if (idEl) idEl.innerText = "@" + (data.username || "member");
    }
  } catch (err) {
    console.error("User data error:", err);
  }
});