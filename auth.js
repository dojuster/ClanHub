import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUM-UWPTMi_lVSOROrzkkp5ceZrh67Ev0",
  authDomain: "clanhub-82f8c.firebaseapp.com",
  databaseURL: "https://clanhub-82f8c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clanhub-82f8c",
  storageBucket: "clanhub-82f8c.firebasestorage.app",
  messagingSenderId: "690675796813",
  appId: "1:690675796813:web:9cbafb424391ef258a8504"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Select elements from your login.html
const loginForm = document.querySelector('#login-form');
const errorMessage = document.querySelector('#error-message');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get user input
        const email = document.querySelector('#login-email').value;
        const password = document.querySelector('#login-password').value;

        // Sign in logic
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Success! Logged in as:", userCredential.user.email);
                // Redirect to your main app page
                window.location.href = "dashboard.html"; 
            })
            .catch((error) => {
                console.error("Login Error:", error.code);
                errorMessage.textContent = "Invalid email or password.";
            });
    });
}

// Monitor Auth State (Useful for Python backend integration)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is currently signed in.");
    } else {
        console.log("No user signed in.");
    }
});