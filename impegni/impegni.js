import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await caricaImpegni();

  // Gestione Modale Pop-up
  const modal = document.getElementById("modal-impegno");
  const openBtn = document.getElementById("open-modal-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-modal-btn");
  const formImpegno = document.getElementById("form-impegno");

  function toggleModal(open) {
    if (modal) {
      if (open) {
        modal.classList.add("active");
      } else {
        modal.classList.remove("active");
        if (formImpegno) formImpegno.reset();
      }
    }
  }

  if (openBtn) openBtn.addEventListener("click", () => toggleModal(true));
  if (closeBtn) closeBtn.addEventListener("click", () => toggleModal(false));
  if (cancelBtn) cancelBtn.addEventListener("click", () => toggleModal(false));
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) toggleModal(false);
    });
  }

  // Salvataggio Nuovo Impegno
  if (formImpegno) {
    formImpegno.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titolo = document.getElementById("titolo").value.trim();
      const data = document.getElementById("data").value;
      const oraInizio = document.getElementById("oraInizio").value;
      const creatore = localStorage.getItem("sitoFamiglia_user") || "Famiglia";
      const creatoIl = new Date().toISOString();

      try {
        await addDoc(collection(db, "appuntamenti"), {
          titolo,
          data,
          oraInizio,
          creatore,
          creatoIl
        });

        toggleModal(false);
        await caricaImpegni();
      } catch (err) {
        console.error("Errore salvataggio impegno:", err);
        alert("Errore durante il salvataggio dell'impegno.");
      }
    });
  }
});

// Funzione di caricamento e render degli impegni dalla collezione "appuntamenti"
async function caricaImpegni() {
  const listaContainer = document.getElementById("lista-impegni-completa");
  if (!listaContainer) return;

  try {
    const snap = await getDocs(collection(db, "appuntamenti"));
    listaContainer.innerHTML = "";

    if (snap.empty) {
      listaContainer.innerHTML = `<p style="color: #666;">Nessun impegno in programma.</p>`;
      return;
    }

    const impegni = [];
    snap.forEach(docSnap => {
      impegni.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Ordina per data e ora crescente
    impegni.sort((a, b) => {
      const dataA = `${a.data || ''} ${a.oraInizio || ''}`;
      const dataB = `${b.data || ''} ${b.oraInizio || ''}`;
      return dataA.localeCompare(dataB);
    });

    impegni.forEach(item => {
      const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";

      const div = document.createElement("div");
      div.className = "impegno-item";
      div.innerHTML = `
        <div class="impegno-info">
          <span class="impegno-titolo">${item.titolo}</span>
          <span class="impegno-dettaglio">${dataFormattata} (${item.creatore || 'Anonimo'})</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="impegno-ora"><i class="far fa-clock"></i> ${item.oraInizio || ''}</span>
          <button class="btn-delete" data-id="${item.id}" title="Elimina impegno">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      listaContainer.appendChild(div);
    });

    // Gestione eliminazione
    const deleteButtons = listaContainer.querySelectorAll(".btn-delete");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm("Vuoi davvero eliminare questo impegno?")) {
          try {
            await deleteDoc(doc(db, "appuntamenti", id));
            await caricaImpegni();
          } catch (err) {
            console.error("Errore eliminazione:", err);
            alert("Impossibile eliminare l'impegno.");
          }
        }
      });
    });

  } catch (err) {
    console.error("Errore caricamento impegni:", err);
    listaContainer.innerHTML = `<p style="color: #dc3545;">Errore caricamento dati da Firestore.</p>`;
  }
}
