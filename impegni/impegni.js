import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentDate = new Date(); // Gestisce il mese corrente visualizzato

document.addEventListener("DOMContentLoaded", async () => {
    currentDate.setDate(1); // Mette sempre il primo del mese come riferimento
    await caricaImpegniMese();

    const prevBtn = document.getElementById("prev-week-btn");
    const nextBtn = document.getElementById("next-week-btn");

    if (prevBtn) {
        prevBtn.addEventListener("click", async () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            await caricaImpegniMese();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", async () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            await caricaImpegniMese();
        });
    }

    // Gestione Modale Pop-up inserimento impegno
    const modal = document.getElementById("modal-impegno");
    const closeBtn = document.getElementById("close-modal-btn");
    const cancelBtn = document.getElementById("cancel-modal-btn");
    const formImpegno = document.getElementById("form-impegno");

    function toggleModal(open, dataPreimpostata = "") {
        if (modal) {
            if (open) {
                modal.classList.add("active");
                if (dataPreimpostata) {
                    const dataInput = document.getElementById("data");
                    if (dataInput) dataInput.value = dataPreimpostata;
                }
            } else {
                modal.classList.remove("active");
                if (formImpegno) formImpegno.reset();
            }
        }
    }

    window.apriModaleConData = (dataStr) => toggleModal(true, dataStr);

    if (closeBtn) closeBtn.addEventListener("click", () => toggleModal(false));
    if (cancelBtn) cancelBtn.addEventListener("click", () => toggleModal(false));
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) toggleModal(false);
        });
    }

    // Salvataggio Nuovo Impegno su Firestore
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
                await addDoc(collection(db, "impegni"), {
                    titolo,
                    data,
                    oraInizio,
                    oraFine,
                    creatore,
                    creatoIl
                });

                toggleModal(false);
                await caricaImpegniMese();
            } catch (err) {
                console.error("Errore salvataggio impegno:", err);
                alert("Errore durante il salvataggio dell'impegno.");
            }
        });
    }
});

// Funzione ausiliaria per convertire la prima lettera in maiuscolo
function capitalizza(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Funzione ausiliaria per convertire un colore esadecimale in RGBA con alpha ridotto
function hexToRgba(hex, alpha = 0.25) {
    if (!hex || !hex.startsWith('#')) return 'rgba(241, 245, 249, 0.8)';
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(char => char + char).join('');
    }
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

async function caricaImpegniMese() {
    const container = document.getElementById("days-container");
    const weekLabel = document.getElementById("week-range-label");
    if (!container) return;

    try {
        const anno = currentDate.getFullYear();
        const mese = currentDate.getMonth();

        // Nome del mese corrente (es. "Novembre") senza anno
        const nomeMese = currentDate.toLocaleDateString('it-IT', { month: 'long' });
        if (weekLabel) {
            weekLabel.textContent = capitalizza(nomeMese);
        }

        container.innerHTML = "";

        // 1. Intestazione 7 colonne: Lun, Mar, Mer, Gio, Ven, Sab, Dom
        const giorniNomi = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
        giorniNomi.forEach((g, index) => {
            const headerCell = document.createElement("div");
            headerCell.className = `calendar-header-cell ${index === 6 ? 'domenica' : ''}`;
            headerCell.textContent = g;
            container.appendChild(headerCell);
        });

        // 2. Calcolo dei giorni della griglia mensile partendo dal Lunedì
        const primoGiornoDelMese = new Date(anno, mese, 1);
        const ultimoGiornoDelMese = new Date(anno, mese + 1, 0);

        let giornoSettimanaInizio = primoGiornoDelMese.getDay(); // 0 = Domenica, 1 = Lunedì...
        // Convertiamo per far iniziare la settimana da Lunedì (0 = Lunedì, 6 = Domenica)
        giornoSettimanaInizio = giornoSettimanaInizio === 0 ? 6 : giornoSettimanaInizio - 1;

        const giorniGriglia = [];

        // Giorni del mese precedente per riempire la prima settimana
        const ultimoGiornoMesePrec = new Date(anno, mese, 0).getDate();
        for (let i = giornoSettimanaInizio - 1; i >= 0; i--) {
            const d = new Date(anno, mese - 1, ultimoGiornoMesePrec - i);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: false });
        }

        // Giorni del mese corrente
        for (let i = 1; i <= ultimoGiornoDelMese.getDate(); i++) {
            const d = new Date(anno, mese, i);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: true });
        }

        // Giorni del mese successivo per completare le righe della griglia (portiamo a multipli di 7, es. 35 o 42 celle)
        let giornoCont = 1;
        while (giorniGriglia.length % 7 !== 0 || giorniGriglia.length < 35) {
            const d = new Date(anno, mese + 1, giornoCont++);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: false });
        }

        // Caricamento colori utenti e impegni da Firestore
        const utentiSnap = await getDocs(collection(db, "utenti"));
        const mappaColori = {};
        utentiSnap.forEach(uDoc => {
            const uData = uDoc.data();
            mappaColori[uDoc.id.toLowerCase()] = uData.colore || "#2563eb";
        });

        const snap = await getDocs(collection(db, "impegni"));
        const impegniPerData = {};

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const d = data.data;
            if (!impegniPerData[d]) impegniPerData[d] = [];
            impegniPerData[d].push({
                id: docSnap.id,
                ...data
            });
        });

        // 3. Render delle celle nella griglia
        giorniGriglia.forEach(itemGiorno => {
            const d = itemGiorno.dataObj;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dataIso = `${yyyy}-${mm}-${dd}`;
            const isDomenica = d.getDay() === 0;

            const impegniDelGiorno = impegniPerData[dataIso] || [];
            impegniDelGiorno.sort((a, b) => (a.oraInizio || "").localeCompare(b.oraInizio || ""));

            const cell = document.createElement("div");
            cell.className = `calendar-cell ${!itemGiorno.isCurrentMonth ? 'other-month' : ''} ${isDomenica ? 'domenica' : ''}`;

            let htmlImpegni = "";
            impegniDelGiorno.forEach(item => {
                const creatoreGreco = item.creatore || 'Anonimo';
                const creatoreFormatted = capitalizza(creatoreGreco);
                const coloreBase = mappaColori[creatoreGreco.toLowerCase()] || "#2563eb";
                const coloreSfondoAlpha = hexToRgba(coloreBase, 0.25);

                htmlImpegni += `
                    <div class="impegno-mini-card" style="background-color: ${coloreSfondoAlpha}; border-left-color: ${coloreBase};">
                        <div class="impegno-mini-header">
                            <span class="impegno-titolo" title="${item.titolo}">${item.titolo}</span>
                            <button class="btn-delete" data-id="${item.id}" title="Elimina">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="impegno-orari">${item.oraInizio || '--:--'}</div>
                    </div>
                `;
            });

            cell.innerHTML = `
                <div class="cell-header ${isDomenica ? 'domenica-text' : ''}">
                    <span>${d.getDate()}</span>
                    <button class="btn-aggiungi-giorno" onclick="window.apriModaleConData('${dataIso}')" title="Aggiungi impegno">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cell-impegni-list">
                    ${htmlImpegni}
                </div>
            `;

            container.appendChild(cell);
        });

        // Gestione eliminazione impegni
        const deleteButtons = container.querySelectorAll(".btn-delete");
        deleteButtons.forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const id = e.currentTarget.getAttribute("data-id");
                if (confirm("Vuoi davvero eliminare questo impegno?")) {
                    try {
                        await deleteDoc(doc(db, "impegni", id));
                        await caricaImpegniMese();
                    } catch (err) {
                        console.error("Errore eliminazione:", err);
                        alert("Impossibile eliminare l'impegno.");
                    }
                }
            });
        });

    } catch (err) {
        console.error("Errore caricamento impegni:", err);
        container.innerHTML = `<p style="padding: 15px; color: #dc3545; grid-column: span 7;">Errore caricamento impegni da Firestore.</p>`;
    }
}
