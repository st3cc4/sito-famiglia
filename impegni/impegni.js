import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentDate = new Date();
let impegnoSelezionatoCorrente = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentDate.setDate(1);
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

    // Gestione Modale Inserimento / Modifica Form
    const modalForm = document.getElementById("modal-impegno");
    const closeFormBtn = document.getElementById("close-modal-btn");
    const cancelFormBtn = document.getElementById("cancel-modal-btn");
    const formImpegno = document.getElementById("form-impegno");
    const oraInizioInput = document.getElementById("oraInizio");
    const oraFineInput = document.getElementById("oraFine");

    // Autocompilazione Ora Fine (+1 ora rispetto a Ora Inizio)
    if (oraInizioInput && oraFineInput) {
        oraInizioInput.addEventListener("change", () => {
            const valInizio = oraInizioInput.value;
            if (valInizio) {
                const [ore, minuti] = valInizio.split(':').map(Number);
                let nuoveOre = ore + 1;
                if (nuoveOre >= 24) nuoveOre = 0;
                const oreStr = String(nuoveOre).padStart(2, '0');
                const minutiStr = String(minuti).padStart(2, '0');
                oraFineInput.value = `${oreStr}:${minutiStr}`;
            }
        });
    }

    function toggleModalForm(open, dataPreimpostata = "", impegnoEdit = null) {
        if (modalForm) {
            const titoloModal = document.getElementById("modal-form-title");
            const idEditInput = document.getElementById("impegno-id-edit");

            if (open) {
                modalForm.classList.add("active");
                if (impegnoEdit) {
                    titoloModal.textContent = "Modifica Impegno";
                    idEditInput.value = impegnoEdit.id;
                    document.getElementById("titolo").value = impegnoEdit.titolo || "";
                    document.getElementById("data").value = impegnoEdit.data || "";
                    document.getElementById("oraInizio").value = impegnoEdit.oraInizio || "";
                    document.getElementById("oraFine").value = impegnoEdit.oraFine || "";
                } else {
                    titoloModal.textContent = "Nuovo Impegno";
                    idEditInput.value = "";
                    formImpegno.reset();
                    if (dataPreimpostata) {
                        const dataInput = document.getElementById("data");
                        if (dataInput) dataInput.value = dataPreimpostata;
                    }
                }
            } else {
                modalForm.classList.remove("active");
                formImpegno.reset();
                idEditInput.value = "";
            }
        }
    }

    window.apriModaleConData = (dataStr) => toggleModalForm(true, dataStr);

    if (closeFormBtn) closeFormBtn.addEventListener("click", () => toggleModalForm(false));
    if (cancelFormBtn) cancelFormBtn.addEventListener("click", () => toggleModalForm(false));

    // Gestione Modale Dettaglio
    const modalDet = document.getElementById("modal-dettaglio");
    const closeDetBtn = document.getElementById("close-det-btn");
    const chiudiDetBtn = document.getElementById("det-btn-chiudi");
    const eliminaDetBtn = document.getElementById("det-btn-elimina");
    const modificaDetBtn = document.getElementById("det-btn-modifica");
    const calendarioDetBtn = document.getElementById("det-btn-calendario");

    function toggleModalDet(open, item = null) {
        if (modalDet) {
            if (open && item) {
                impegnoSelezionatoCorrente = item;
                document.getElementById("det-titolo").textContent = item.titolo || "-";
                document.getElementById("det-data").textContent = item.data || "-";
                document.getElementById("det-orario").textContent = `${item.oraInizio || '--:--'} - ${item.oraFine || '--:--'}`;
                document.getElementById("det-autore").textContent = capitalizza(item.creatore || 'Famiglia');
                modalDet.classList.add("active");
            } else {
                modalDet.classList.remove("active");
                impegnoSelezionatoCorrente = null;
            }
        }
    }

    window.apriDettaglioImpegno = (itemJson) => {
        try {
            const item = JSON.parse(decodeURIComponent(itemJson));
            toggleModalDet(true, item);
        } catch (e) {
            console.error("Errore apertura dettaglio:", e);
        }
    };

    if (closeDetBtn) closeDetBtn.addEventListener("click", () => toggleModalDet(false));
    if (chiudiDetBtn) chiudiDetBtn.addEventListener("click", () => toggleModalDet(false));

    // Pulsante "Salva sul calendario" (rileva automaticamente iOS vs Google Calendar)
    if (calendarioDetBtn) {
        calendarioDetBtn.addEventListener("click", () => {
            if (!impegnoSelezionatoCorrente) return;
            salvaSuCalendarioPersonale(impegnoSelezionatoCorrente);
        });
    }

    // Tasto Elimina da Dettaglio
    if (eliminaDetBtn) {
        eliminaDetBtn.addEventListener("click", async () => {
            if (impegnoSelezionatoCorrente && confirm("Vuoi davvero eliminare questo impegno?")) {
                try {
                    await deleteDoc(doc(db, "impegni", impegnoSelezionatoCorrente.id));
                    toggleModalDet(false);
                    await caricaImpegniMese();
                } catch (err) {
                    console.error("Errore eliminazione:", err);
                    alert("Impossibile eliminare l'impegno.");
                }
            }
        });
    }

    // Tasto Modifica da Dettaglio
    if (modificaDetBtn) {
        modificaDetBtn.addEventListener("click", () => {
            const itemToEdit = impegnoSelezionatoCorrente;
            toggleModalDet(false);
            if (itemToEdit) {
                toggleModalForm(true, "", itemToEdit);
            }
        });
    }

    // Salvataggio (Nuovo o Modifica) su Firestore
    if (formImpegno) {
        formImpegno.addEventListener("submit", async (e) => {
            e.preventDefault();

            const idEdit = document.getElementById("impegno-id-edit").value;
            const titolo = document.getElementById("titolo").value.trim();
            const data = document.getElementById("data").value;
            const oraInizio = document.getElementById("oraInizio").value;
            const oraFine = document.getElementById("oraFine").value;
            const creatore = localStorage.getItem("sitoFamiglia_user") || "Famiglia";

            try {
                if (idEdit) {
                    await updateDoc(doc(db, "impegni", idEdit), {
                        titolo,
                        data,
                        oraInizio,
                        oraFine
                    });
                } else {
                    await addDoc(collection(db, "impegni"), {
                        titolo,
                        data,
                        oraInizio,
                        oraFine,
                        creatore,
                        creatoIl: new Date().toISOString()
                    });
                }

                toggleModalForm(false);
                await caricaImpegniMese();
            } catch (err) {
                console.error("Errore salvataggio impegno:", err);
                alert("Errore durante il salvataggio dell'impegno.");
            }
        });
    }
});

// Rileva se il dispositivo è iOS (iPhone / iPad / iPod)
function isDispositivoIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Converte data ("YYYY-MM-DD") e ora ("HH:MM") in formato locale YYYYMMDDTHHMMSS
function formattaDataOraLocale(dataIso, oraStr) {
    const [yyyy, mm, dd] = (dataIso || "2026-01-01").split("-");
    const [hh, min] = (oraStr || "09:00").split(":");
    return `${yyyy}${mm}${dd}T${String(hh).padStart(2, '0')}${String(min).padStart(2, '0')}00`;
}

// Scarica/apre un file .ics per Calendario Apple (iPhone/iPad)
function esportaFileICS(item) {
    const startLocal = formattaDataOraLocale(item.data, item.oraInizio || "09:00");
    const endLocal = formattaDataOraLocale(item.data, item.oraFine || item.oraInizio || "10:00");
    const uid = `${item.id || Date.now()}@sitofamiglia.local`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const descrizione = `Creato da: ${capitalizza(item.creatore || "Famiglia")}`;

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Sito Famiglia//Impegni//IT",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${startLocal}`,
        `DTEND:${endLocal}`,
        `SUMMARY:${item.titolo || "Impegno"}`,
        `DESCRIPTION:${descrizione}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(item.titolo || "impegno").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Apre il link rapido di Google Calendar per Android / PC
function apriGoogleCalendar(item) {
    const startLocal = formattaDataOraLocale(item.data, item.oraInizio || "09:00");
    const endLocal = formattaDataOraLocale(item.data, item.oraFine || item.oraInizio || "10:00");

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: item.titolo || "Impegno",
        dates: `${startLocal}/${endLocal}`,
        details: `Creato da: ${capitalizza(item.creatore || "Famiglia")}`
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener,noreferrer");
}

function salvaSuCalendarioPersonale(item) {
    if (!item.data) {
        alert("Impossibile esportare: data mancante.");
        return;
    }

    if (isDispositivoIOS()) {
        esportaFileICS(item);
    } else {
        apriGoogleCalendar(item);
    }
}

function capitalizza(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

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

        const nomeMese = currentDate.toLocaleDateString('it-IT', { month: 'long' });
        if (weekLabel) {
            weekLabel.textContent = capitalizza(nomeMese);
        }

        container.innerHTML = "";

        // Intestazione 7 colonne
        const giorniNomi = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
        giorniNomi.forEach((g, index) => {
            const headerCell = document.createElement("div");
            headerCell.className = `calendar-header-cell ${index === 6 ? 'domenica' : ''}`;
            headerCell.textContent = g;
            container.appendChild(headerCell);
        });

        const primoGiornoDelMese = new Date(anno, mese, 1);
        const ultimoGiornoDelMese = new Date(anno, mese + 1, 0);

        let giornoSettimanaInizio = primoGiornoDelMese.getDay();
        giornoSettimanaInizio = giornoSettimanaInizio === 0 ? 6 : giornoSettimanaInizio - 1;

        const giorniGriglia = [];

        const ultimoGiornoMesePrec = new Date(anno, mese, 0).getDate();
        for (let i = giornoSettimanaInizio - 1; i >= 0; i--) {
            const d = new Date(anno, mese - 1, ultimoGiornoMesePrec - i);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: false });
        }

        for (let i = 1; i <= ultimoGiornoDelMese.getDate(); i++) {
            const d = new Date(anno, mese, i);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: true });
        }

        let giornoCont = 1;
        while (giorniGriglia.length % 7 !== 0 || giorniGriglia.length < 35) {
            const d = new Date(anno, mese + 1, giornoCont++);
            giorniGriglia.push({ dataObj: d, isCurrentMonth: false });
        }

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
            cell.setAttribute("onclick", `window.apriModaleConData('${dataIso}')`);

            let htmlImpegni = "";
            impegniDelGiorno.forEach(item => {
                const creatoreGreco = item.creatore || 'Anonimo';
                const coloreBase = mappaColori[creatoreGreco.toLowerCase()] || "#2563eb";
                const coloreSfondoAlpha = hexToRgba(coloreBase, 0.25);

                const itemSerialized = encodeURIComponent(JSON.stringify(item));

                htmlImpegni += `
                    <div class="impegno-mini-card" style="background-color: ${coloreSfondoAlpha}; border-left-color: ${coloreBase};" onclick="event.stopPropagation(); window.apriDettaglioImpegno('${itemSerialized}')" title="${item.titolo}">
                        <span class="impegno-titolo">${item.titolo}</span>
                    </div>
                `;
            });

            cell.innerHTML = `
                <div class="cell-header ${isDomenica ? 'domenica-text' : ''}">
                    <span>${d.getDate()}</span>
                </div>
                <div class="cell-impegni-list">
                    ${htmlImpegni}
                </div>
            `;

            container.appendChild(cell);
        });

    } catch (err) {
        console.error("Errore caricamento impegni:", err);
        container.innerHTML = `<p style="padding: 15px; color: #dc3545; grid-column: span 7;">Errore caricamento impegni da Firestore.</p>`;
    }
}
