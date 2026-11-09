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
      const oraFine = document.getElementById("oraFine").value;
      const creatore = localStorage.getItem("sitoFamiglia_user") || "Famiglia";
      const creatoIl = new Date().toISOString();

      try {
        await addDoc(collection(db, "appuntamenti"), {
          titolo,
          data,
          oraInizio,
          oraFine,
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

// Funzione di caricamento impegni con suddivisione settimanale e griglia 4x2
async function caricaImpegni() {
  const container = document.getElementById("lista-impegni-completa");
  if (!container) return;

  try {
    container.innerHTML = `<p style="padding: 10px; color: #666;">Caricamento impegni in corso...</p>`;

    // 1. Carica i colori degli utenti
    const utentiSnap = await getDocs(collection(db, "utenti"));
    const mappaColori = {};
    utentiSnap.forEach(uDoc => {
      const uData = uDoc.data();
      mappaColori[uDoc.id.toLowerCase()] = uData.colore || "#f1f5f9";
    });

    // 2. Carica gli impegni dalla collezione "appuntamenti"
    const snap = await getDocs(collection(db, "appuntamenti"));
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `<p style="padding: 15px; color: #666; text-align: center;">Nessun impegno in programma.</p>`;
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

    const impegniPerData = {};
    impegni.forEach(item => {
      const d = item.data || "Senza Data";
      if (!impegniPerData[d]) impegniPerData[d] = [];
      impegniPerData[d].push(item);
    });

    const settimaneMap = {};
    Object.keys(impegniPerData).forEach(dataStr => {
      const dataObj = new Date(dataStr);
      const giorno = dataObj.getDay();
      const diff = dataObj.getDate() - giorno + (giorno === 0 ? -6 : 1);
      const lunedi = new Date(dataObj.setDate(diff));
      const settimanaKey = lunedi.toISOString().split('T')[0];

      if (!settimaneMap[settimanaKey]) {
        settimaneMap[settimanaKey] = [];
      }
      settimaneMap[settimanaKey].push(dataStr);
    });

    const settimaneOrdinate = Object.keys(settimaneMap).sort();

    settimaneOrdinate.forEach(settimanaKey => {
      const dateDellaSettimana = settimaneMap[settimanaKey].sort();

      const lunediObj = new Date(settimanaKey);
      const domenicaObj = new Date(lunediObj);
      domenicaObj.setDate(lunediObj.getDate() + 6);

      const labelSettimana = `Settimana dal ${lunediObj.toLocaleDateString('it-IT')} al ${domenicaObj.toLocaleDateString('it-IT')}`;

      const settimanaCard = document.createElement("div");
      settimanaCard.className = "settimana-card";
      settimanaCard.style.cssText = "background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; margin-bottom: 20px;";
      
      let htmlGiornate = "";

      dateDellaSettimana.forEach(dataStr => {
        const dataObj = new Date(dataStr);
        const nomeGiorno = dataObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const isDomenica = dataObj.getDay() === 0;

        htmlGiornate += `
          <div class="giornata-sezione" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px;">
            <div class="giorno-titolo ${isDomenica ? 'domenica' : ''}" style="font-size: 1rem; font-weight: 700; color: ${isDomenica ? '#ef4444' : '#334155'}; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-calendar-day"></i> ${nomeGiorno.charAt(0).toUpperCase() + nomeGiorno.slice(1)}
            </div>
            <div class="impegni-griglia" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        `;

        impegniPerData[dataStr].forEach(item => {
          const creatore = (item.creatore || "").toLowerCase();
          const coloreSfondo = mappaColori[creatore] || "#f1f5f9";

          htmlGiornate += `
            <div class="impegno-card" style="background-color: ${coloreSfondo}; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; gap: 8px; min-height: 110px;">
              <div class="impegno-header-card" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div class="impegno-titolo" style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">${item.titolo}</div>
                  <div class="impegno-autore" style="font-size: 0.75rem; opacity: 0.8; font-weight: 600;">Inserito da: ${item.creatore || 'Anonimo'}</div>
                </div>
                <button class="btn-delete" data-id="${item.id}" title="Elimina impegno" style="background: transparent; color: #dc2626; border: none; font-size: 1rem; cursor: pointer; padding: 4px;">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <div class="impegno-orari" style="font-size: 0.85rem; font-weight: bold; color: #1e293b; display: flex; align-items: center; gap: 5px;">
                <i class="far fa-clock"></i> ${item.oraInizio || '--:--'} - ${item.oraFine || '--:--'}
              </div>
            </div>
          `;
        });

        htmlGiornate += `
            </div>
          </div>
        `;
      });

      settimanaCard.innerHTML = `
        <div class="settimana-header" style="background-color: #0f172a; color: white; padding: 14px 20px; font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-calendar-week"></i> ${labelSettimana}
        </div>
        <div class="settimana-body" style="padding: 20px;">
          ${htmlGiornate}
        </div>
      `;

      container.appendChild(settimanaCard);
    });

    // Gestione eliminazione
    const deleteButtons = container.querySelectorAll(".btn-delete");
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
    container.innerHTML = `<p style="padding: 15px; color: #dc3545;">Errore caricamento dati da Firestore.</p>`;
  }
}
