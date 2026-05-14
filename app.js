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

/* ========================================================
   🚀 STATIC NAV LOADER (FETCH METHOD)
======================================================== */
async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder || document.querySelector('.bottom-nav')) return;

    try {
        const base = getBasePath();
        const response = await fetch(base + 'nav.html');
        if (!response.ok) throw new Error("Nav file not found");
        
        const navContent = await response.text();
        placeholder.innerHTML = navContent;

        // Apply active class based on URL
        const path = window.location.pathname;
        const page = path.split("/").pop();
        const isRoot = page === "" || page === "index.html" || page === "ClanHub" || path.endsWith('/');

        if (isRoot) document.getElementById('nav-home')?.classList.add('active');
        else if (page.includes('map')) document.getElementById('nav-map')?.classList.add('active');
        else if (page.includes('chat')) document.getElementById('nav-chat')?.classList.add('active');
        else if (page.includes('profile')) document.getElementById('nav-profile')?.classList.add('active');

    } catch (err) {
        console.error("Navbar Injection Failed:", err);
    }
}

/* ========================================================
   🛡️ AUTH OBSERVER
======================================================== */
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const isLoginPage = page === "login.html";

    if (!user) {
        if (!isLoginPage) window.location.replace(getBasePath() + "login.html");
    } else {
        if (isLoginPage) window.location.replace(getBasePath() + "index.html");

        // Inject the Nav from the external file
        injectNavbar();

        // Sync User UI Data
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