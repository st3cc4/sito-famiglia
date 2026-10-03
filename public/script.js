// IMPORTANTE: Sostituisci con la tua configurazione Firebase reale
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
    projectId: "IL_TUO_PROGETTO",
    storageBucket: "IL_TUO_PROGETTO.appspot.com",
    messagingSenderId: "IL_TUO_ID",
    appId: "IL_TUO_APP_ID"
};

// Inizializzazione Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gestione Modale
const modal = document.getElementById("billModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

openModalBtn.addEventListener("click", () => {
    modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Funzione per caricare le bollette da Firebase
async function loadBills() {
    const billsList = document.getElementById("billsList");
    billsList.innerHTML = "<p>Caricamento scadenze...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "bills"));
        billsList.innerHTML = "";

        if (querySnapshot.empty) {
            billsList.innerHTML = "<p>Nessuna bolletta inserita.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const bill = doc.data();
            const item = document.createElement("div");
            item.className = "bill-item";
            item.innerHTML = `
                <div>
                    <strong>${bill.title}</strong><br>
                    <small>Scadenza: ${bill.date}</small>
                </div>
                <div>
                    <span>€ ${parseFloat(bill.amount).toFixed(2)}</span>
                </div>
            `;
            billsList.appendChild(item);
        });
    } catch (error) {
        console.error("Errore nel caricamento delle bollette: ", error);
        billsList.innerHTML = "<p>Errore nel caricamento dei dati.</p>";
    }
}

// Gestione invio form nuova bolletta
const billForm = document.getElementById("billForm");
billForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("billTitle").value;
    const amount = document.getElementById("billAmount").value;
    const date = document.getElementById("billDate").value;

    try {
        await addDoc(collection(db, "bills"), {
            title: title,
            amount: Number(amount),
            date: date,
            createdAt: new Date()
        });

        billForm.reset();
        modal.style.display = "none";
        loadBills(); // Ricarica la lista aggiornata
    } catch (error) {
        console.error("Errore durante il salvataggio: ", error);
        alert("Impossibile salvare la bolletta.");
    }
});

// Carica le bollette all'avvio
loadBills();
