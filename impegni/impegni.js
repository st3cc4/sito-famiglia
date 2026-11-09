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
    // 1. Carica i colori degli utenti
    const utentiSnap = await getDocs(collection(db, "utenti"));
    const mappaColori = {};
    utentiSnap.forEach(uDoc => {
      const uData = uDoc.data();
      mappaColori[uDoc.id.toLowerCase()] = uData.colore || "#f1f5f9";
    });

    // 2. Carica gli impegni
    const snap = await getDocs(collection(db, "appuntamenti"));
    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = `<p style="color: #666;">Nessun impegno in programma.</p>`;
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

    // Raggruppa per settimana dell'anno / mese
    // Per semplicità e pulizia, raggruppiamo per data esatta, organizzate in blocchi settimanali
    const impegniPerData = {};
    impegni.forEach(item => {
      const d = item.data || "Senza Data";
      if (!impegniPerData[d]) impegniPerData[d] = [];
      impegniPerData[d].push(item);
    });

    // Raggruppa le date per Settimana (ISO week o approssimazione pulita)
    const settimaneMap = {};
    Object.keys(impegniPerData).forEach(dataStr => {
      const dataObj = new Date(dataStr);
      // Calcola il lunedì della settimana di appartenenza
      const giorno = dataObj.getDay();
      const diff = dataObj.getDate() - giorno + (giorno === 0 ? -6 : 1);
      const lunedi = new Date(dataObj.setDate(diff));
      const settimanaKey = lunedi.toISOString().split('T')[0];

      if (!settimaneMap[settimanaKey]) {
        settimaneMap[settimanaKey] = [];
      }
      settimaneMap[settimanaKey].push(dataStr);
    });

    // Ordina le settimane
    const settimaneOrdinate = Object.keys(settimaneMap).sort();

    settimaneOrdinate.forEach(settimanaKey => {
      const dateDellaSettimana = settimaneMap[settimanaKey].sort();

      // Calcola etichetta settimana (es. "Settimana dal DD-MM-YYYY al DD-MM-YYYY")
      const lunediObj = new Date(settimanaKey);
      const domenicaObj = new Date(lunediObj);
      domenicaObj.setDate(lunediObj.getDate() + 6);

      const labelSettimana = `Settimana dal ${lunediObj.toLocaleDateString('it-IT')} al ${domenicaObj.toLocaleDateString('it-IT')}`;

      const settimanaCard = document.createElement("div");
      settimanaCard.className = "settimana-card";
      
      let htmlGiornate = "";

      dateDellaSettimana.forEach(dataStr => {
        const dataObj = new Date(dataStr);
        const nomeGiorno = dataObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const isDomenica = dataObj.getDay() === 0; // 0 = Domenica

        htmlGiornate += `
          <div class="giornata-sezione">
            <div class="giorno-titolo ${isDomenica ? 'domenica' : ''}">
              <i class="fas fa-calendar-day"></i> ${nomeGiorno.charAt(0).toUpperCase() + nomeGiorno.slice(1)}
            </div>
            <div class="impegni-griglia">
        `;

        impegniPerData[dataStr].forEach(item => {
          const creatore = (item.creatore || "").toLowerCase();
          const coloreSfondo = mappaColori[creatore] || "#f1f5f9";
          const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";

          htmlGiornate += `
            <div class="impegno-card" style="background-color: ${coloreSfondo};">
              <div class="impegno-header-card">
                <div>
                  <div class="impegno-titolo">${item.titolo}</div>
                  <div class="impegno-autore">Inserito da: ${item.creatore || 'Anonimo'}</div>
                </div>
                <button class="btn-delete" data-id="${item.id}" title="Elimina impegno">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <div class="impegno-orari">
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
        <div class="settimana-header">
          <i class="fas fa-calendar-week"></i> ${labelSettimana}
        </div>
        <div class="settimana-body">
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
    container.innerHTML = `<p style="color: #dc3545;">Errore caricamento dati da Firestore.</p>`;
  }
}
