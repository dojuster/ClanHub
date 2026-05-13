// ---- ClanHub Central Application Logic & Session Manager ----

// The dedicated API gateway routing directly to your background Node/SQLite server engine
const API_URL = "http://192.168.1.6:3000/api"; 

function getBasePath() {
  const loc = window.location;
  return loc.protocol + '//' + loc.host + loc.pathname.substring(0, loc.pathname.lastIndexOf('/')) + '/';
}

/* ========================================================
   🔑 SECURE AUTHENTICATION SYSTEM LOGIC WITH MULTI-ACC
======================================================== */
async function login() {
  const msg = document.getElementById("msg");
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!user || !pass) {
    msg.innerText = "Please complete all login fields.";
    msg.style.color = "#f87171";
    return;
  }

  // Master hardcoded bypass key credentials
  if (user === "admin" && pass === "1234") {
    let sessions = JSON.parse(localStorage.getItem("active_sessions")) || [];
    if (!sessions.includes(user)) { sessions.push(user); }
    localStorage.setItem("active_sessions", JSON.stringify(sessions));
    localStorage.setItem("user", user);
    window.location.href = getBasePath() + "index.html";
    return;
  }

  try {
    // Asynchronous network delivery to the sqlite endpoint
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });

    const data = await res.json();

    if (data.success) {
      // 🚀 FIXED: MULTI-ACCOUNT MANAGEMENT ENGINE LAYER
      let sessions = JSON.parse(localStorage.getItem("active_sessions")) || [];
      
      // Inject username token into storage list array if not present
      if (!sessions.includes(data.username)) {
        sessions.push(data.username);
      }
      
      localStorage.setItem("active_sessions", JSON.stringify(sessions));
      localStorage.setItem("user", data.username); // Set as currently active session view
      
      window.location.href = getBasePath() + "index.html";
    } else {
      msg.innerText = data.error || "Invalid username or password configuration.";
      msg.style.color = "#f87171";
    }
  } catch (err) {
    msg.innerText = "Connection failed. Is server.js active on port 3000?";
    msg.style.color = "#f87171";
    console.error("Fetch login error:", err);
  }
}

/* ========================================================
   💾 CENTRALIZED DATABASE REGISTRATION HANDLER
======================================================== */
async function handleRegister() {
  const msg = document.getElementById("msg");
  
  const name = document.getElementById("reg-name").value;
  const user = document.getElementById("username").value.trim(); 
  const pass = document.getElementById("password").value;
  const contact = document.getElementById("reg-contact").value;
  const otp = document.getElementById("reg-otp").value;
  const isHuman = document.getElementById("human-verify").checked;

  // Frontend validation checks before reaching network
  if (!name || !user || !pass || !otp) {
    msg.innerText = "Please complete all fields!";
    msg.style.color = "#f87171";
    return;
  }
  if (!isHuman) {
    msg.innerText = "Please check the human verification box!";
    msg.style.color = "#f87171";
    return;
  }
  if (otp !== dynamicSessionOTP) {
    msg.innerText = "Invalid verification OTP code!";
    msg.style.color = "#f87171";
    return;
  }

  try {
    // Pushes registration parameters cleanly to the Node server database
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, username: user, password: pass, contact: contact })
    });

    const data = await res.json();

    if (data.success) {
      msg.innerText = "Registration successful!";
      msg.style.color = "lime";
      
      // Flush inputs cleanly
      document.getElementById("reg-name").value = "";
      document.getElementById("reg-contact").value = "";
      document.getElementById("reg-otp").value = "";
      document.getElementById("password").value = "";
      document.getElementById("username").value = "";
      document.getElementById("human-verify").checked = false;
      dynamicSessionOTP = null;

      setTimeout(() => { 
        toggleFormState(); 
      }, 1500);
    } else {
      msg.innerText = data.error || "Registration database error encountered.";
      msg.style.color = "#f87171";
    }
  } catch (err) {
    msg.innerText = "Could not link payload profile to central database node.";
    msg.style.color = "#f87171";
    console.error("Fetch registration error:", err);
  }
}

/* ========================================================
   🚪 CLEAN MULTI-ACCOUNT SIGN OUT INTERACTIVE REBOOTS
======================================================== */
function logout() {
  let activeUser = localStorage.getItem("user");
  let sessions = JSON.parse(localStorage.getItem("active_sessions")) || [];
  
  // Clean active user out of multi-account session memory array
  sessions = sessions.filter(u => u !== activeUser);
  localStorage.setItem("active_sessions", JSON.stringify(sessions));

  if (sessions.length > 0) {
    localStorage.setItem("user", sessions[0]); // Swap automatically to remaining active account token link
    window.location.reload();
  } else {
    localStorage.removeItem("user");
    localStorage.removeItem("active_sessions");
    window.location.href = getBasePath() + "login.html";
  }
}

function checkAuth() {
  const loggedInUser = localStorage.getItem("user");
  if (!loggedInUser) {
    window.location.href = getBasePath() + "login.html";
    return null;
  }
  return loggedInUser;
}

/* ========================================================
   🌐 DYNAMIC FLUID BOTTOM NAVIGATION BAR DRAWER ARCHITECTURE
======================================================== */
function loadNavbar(activeTab) {
  const base = getBasePath();
  const navHTML = `
    <nav class="bottom-nav">
      <a href="${base}index.html" class="nav-item ${activeTab === 'home' ? 'active' : ''}">
        <span class="nav-icon">🏠</span>
        <span>Home</span>
      </a>
      <a href="${base}map.html" class="nav-item ${activeTab === 'map' ? 'active' : ''}">
        <span class="nav-icon">🗺️</span>
        <span>Radar</span>
      </a>
      <a href="${base}chat.html" class="nav-item ${activeTab === 'chat' ? 'active' : ''}">
        <span class="nav-icon">💬</span>
        <span>Chat</span>
      </a>
      <a href="${base}profile.html" class="nav-item ${activeTab === 'profile' ? 'active' : ''}">
        <span class="nav-icon">👤</span>
        <span>Profile</span>
      </a>
    </nav>
  `;
  document.body.insertAdjacentHTML('beforeend', navHTML);
}
