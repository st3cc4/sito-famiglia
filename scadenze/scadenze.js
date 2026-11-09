import { db } from "../home/firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await caricaScadenze();

  const formScadenza = document.getElementById("form-scadenza");
  if (formScadenza) {
    formScadenza.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titolo = document.getElementById("titolo").value.trim();
      const importo = parseFloat(document.getElementById("importo").value);
      const data = document.getElementById("data").value;
      const creatore = localStorage.getItem("sitoFamiglia_user") || "Famiglia";
      const creatoIl = new Date().toISOString();

      try {
        await addDoc(collection(db, "scadenze"), {
          titolo,
          importo,
          data,
          creatore,
          creatoIl
        });

        formScadenza.reset();
        await caricaScadenze();
      } catch (err) {
        console.error("Errore salvataggio scadenza:", err);
        alert("Errore durante il salvataggio della scadenza.");
      }
    });
  }
});

// Funzione di caricamento e render delle scadenze
async function caricaScadenze() {
  const listaContainer = document.getElementById("lista-scadenze-completa");
  if (!listaContainer) return;

  try {
    const snap = await getDocs(collection(db, "scadenze"));
    listaContainer.innerHTML = "";

    if (snap.empty) {
      listaContainer.innerHTML = `<p style="color: #666;">Nessuna scadenza presente.</p>`;
      return;
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const scadenze = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dataScadenza = new Date(data.data);
      dataScadenza.setHours(0, 0, 0, 0);

      const diffTime = dataScadenza.getTime() - oggi.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      scadenze.push({
        id: docSnap.id,
        ...data,
        diffDays
      });
    });

    // Ordina per data crescente (più vicine prima)
    scadenze.sort((a, b) => a.diffDays - b.diffDays);

    scadenze.forEach(item => {
      let classeColore = "scadenza-verde";
      let statoTesto = "";

      if (item.diffDays < 0) {
        classeColore = "scadenza-rosso";
        statoTesto = "Scaduta";
      } else if (item.diffDays <= 7) {
        classeColore = "scadenza-rosso";
        statoTesto = `Tra ${item.diffDays} gg`;
      } else if (item.diffDays <= 14) {
        classeColore = "scadenza-giallo";
        statoTesto = `Tra ${item.diffDays} gg`;
      } else {
        classeColore = "scadenza-verde";
        statoTesto = `Tra ${item.diffDays} gg`;
      }

      if (item.diffDays === 0) statoTesto = "Scade Oggi";

      const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";
      const importoFormatted = parseFloat(item.importo || 0).toFixed(2);

      const li = document.createElement("li");
      li.className = `scadenza-item ${classeColore}`;
      li.innerHTML = `
        <div class="scadenza-info">
          <span class="scadenza-titolo">${item.titolo} € ${importoFormatted}</span>
          <span class="scadenza-dettaglio">${dataFormattata} (${item.creatore || 'Anonimo'}) - ${statoTesto}</span>
        </div>
        <button class="btn-delete" data-id="${item.id}" title="Elimina scadenza">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      listaContainer.appendChild(li);
    });

    // Gestione eliminazione
    const deleteButtons = listaContainer.querySelectorAll(".btn-delete");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm("Vuoi davvero eliminare questa scadenza?")) {
          try {
            await deleteDoc(doc(db, "scadenze", id));
            await caricaScadenze();
          } catch (err) {
            console.error("Errore eliminazione:", err);
            alert("Impossibile eliminare la scadenza.");
          }
        }
      });
    });

  } catch (err) {
    console.error("Errore caricamento scadenze:", err);
    listaContainer.innerHTML = `<p style="color: #dc3545;">Errore caricamento dati da Firestore.</p>`;
  }
}
