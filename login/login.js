import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtMnKhhfC43J73KvM8-QcNghqzOTV6UKA",
  authDomain: "sito-famiglia.firebaseapp.com",
  projectId: "sito-famiglia",
  storageBucket: "sito-famiglia.appspot.com",
  messagingSenderId: "93216467751",
  appId: "1:93216467751:web:9930052845521ca5ef895a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      errorMessage.textContent = "";

      try {
        const userDocRef = doc(db, "utenti", username);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.password === password) {
            localStorage.setItem("sitoFamiglia_logged", "true");
            localStorage.setItem("sitoFamiglia_user", userData.username);
            localStorage.setItem("sitoFamiglia_ruolo", userData.ruolo);
            localStorage.setItem("sitoFamiglia_permessi", JSON.stringify(userData.permessi || {}));
            
            window.location.href = "../index.html";
          } else {
            errorMessage.textContent = "Password errata.";
          }
        } else {
          errorMessage.textContent = "Utente non trovato.";
        }
      } catch (error) {
        console.error("Errore durante il login:", error);
        errorMessage.textContent = "Errore di connessione a Firestore.";
      }
    });
  }
});
