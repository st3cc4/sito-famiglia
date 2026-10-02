let loggedUser = null;
let isUserAdmin = false;
let activePermissions = [];

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => { console.log('Service Worker registrato', reg.scope); })
            .catch((err) => { console.log('Service Worker fallito: ', err); });
    });
}

// Gestione apertura/chiusura sidebar
document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});

// Assicuriamo l'ascolto del login non appena i pulsanti sono pronti
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('auth-password').addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleLogin(); 
    });
});

window.addEventListener('firebase-ready', async () => {
    const { db, firebaseFns } = window;
    const { doc, getDoc, setDoc } = firebaseFns;

    try {
        const adminRef = doc(db, "users", "stpa79@gmail.com");
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
            await setDoc(adminRef, { 
                name: "Stecca", 
                role: "Admin", 
                pass: "sv058753",
                permissions: ["section-bills", "section-gallery", "section-recipes", "section-calendar"]
            });
        }
    } catch (err) {
        console.error("Errore inizializzazione admin:", err);
    }

    const savedEmail = localStorage.getItem('family_user_email');
    const savedPass = localStorage.getItem('family_user_pass');
    if (savedEmail && savedPass) {
        document.getElementById('auth-email').value = savedEmail;
        document.getElementById('auth-password').value = savedPass;
        document.getElementById('remember-me').checked = true;
        // Tentativo di accesso automatico immediato se salvato
        handleLogin();
    } else {
        loadBills();
        loadEvents();
        loadRecipes();
    }
});

async function handleLogin() {
    const emailField = document.getElementById('auth-email');
    const passField = document.getElementById('auth-password');
    const rememberField = document.getElementById('remember-me');
    const errorBox = document.getElementById('error-message');

    if (!emailField || !passField) return;

    const email = emailField.value.trim().toLowerCase();
    const password = passField.value.trim();
    const remember = rememberField ? rememberField.checked : false;

    if (!window.db) {
        alert("Connessione a Firebase in corso, attendi un secondo...");
        return;
    }

    try {
        const { db, firebaseFns } = window;
        const { doc, getDoc } = firebaseFns;

        const userRef = doc(db, "users", email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().pass === password) {
            const userData = userSnap.data();
            loggedUser = userData.name;
            isUserAdmin = userData.role === 'Admin';
            activePermissions = userData.permissions || ["section-bills", "section-gallery", "section-recipes", "section-calendar"];
            
            if (remember) {
                localStorage.setItem('family_user_email', email);
                localStorage.setItem('family_user_pass', password);
            } else {
                localStorage.removeItem('family_user_email');
                localStorage.removeItem('family_user_pass');
            }

            document.getElementById('auth-overlay').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            document.getElementById('current-user-badge').innerText = `Utente: ${loggedUser}`;
            document.getElementById('welcome-title').innerText = `Ciao, ${loggedUser}! 👋`;

            applyUserPermissions();

            if (isUserAdmin) {
                document.getElementById('menu-admin').style.display = 'flex';
                loadMembersList();
            }
            loadBills();
            loadEvents();
            loadRecipes();
        } else {
            errorBox.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        alert("Errore di connessione a Firebase.");
    }
}

function applyUserPermissions() {
    const sectionsMap = {
        'section-bills': { menu: 'menu-bills', card: 'card-bills' },
        'section-gallery': { menu: 'menu-gallery', card: 'card-gallery' },
        'section-recipes': { menu: 'menu-recipes', card: null },
        'section-calendar': { menu: 'menu-calendar', card: 'card-calendar' }
    };

    Object.keys(sectionsMap).forEach(secKey => {
        const conf = sectionsMap[secKey];
        const hasAccess = isUserAdmin || activePermissions.includes(secKey);

        if (document.getElementById(conf.menu)) {
            document.getElementById(conf.menu).style.display = hasAccess ? 'flex' : 'none';
        }
        if (conf.card && document.getElementById(conf.card)) {
            document.getElementById(conf.card).style.display = hasAccess ? 'flex' : 'none';
        }
    });
}

window.switchSection = function(targetId) {
    document.querySelectorAll('.sidebar-menu li').forEach(i => {
        if (i.getAttribute('data-target') === targetId) i.classList.add('active');
        else i.classList.remove('active');
    });
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const titles = {
        'section-overview': 'Panoramica',
        'section-bills': 'Bollette',
        'section-gallery': 'Foto e video',
        'section-recipes': 'Ricettario',
        'section-calendar': 'Calendario',
        'section-admin': 'Admin'
    };
    document.getElementById('page-title').innerText = titles[targetId] || 'Portale';
}

// ================= BOLLETTE =================
document.getElementById('btn-add-bill').addEventListener('click', async () => {
    const title = document.getElementById('bill-title').value.trim();
    const amount = parseFloat(document.getElementById('bill-amount').value);
    const date = document.getElementById('bill-date').value;

    if (!title || isNaN(amount) || !date) {
        alert("Compila tutti i campi correttamente per aggiungere la bolletta.");
        return;
    }

    try {
        const { db, firebaseFns } = window;
        const { collection, addDoc } = firebaseFns;

        await addDoc(collection(db, "bills"), { title, amount, date, paid: false });

        document.getElementById('bill-title').value = '';
        document.getElementById('bill-amount').value = '';
        document.getElementById('bill-date').value = '';
        loadBills();
    } catch (err) {
        console.error(err);
        alert("Errore nel salvataggio della bolletta.");
    }
});

async function loadBills() {
    const overviewContainer = document.getElementById('overview-bills-list');
    const overviewTotalBox = document.getElementById('overview-bills-total');
    const overviewTotalAmount = document.getElementById('overview-total-amount');
    
    const pageContainer = document.getElementById('bills-list-container');
    const pageTotalAmount = document.getElementById('bills-page-total');

    if (!window.db) return;

    try {
        const { db, firebaseFns } = window;
        const { collection, getDocs } = firebaseFns;

        const querySnapshot = await getDocs(collection(db, "bills"));
        let bills = [];

        querySnapshot.forEach((docSnap) => {
            bills.push({ id: docSnap.id, ...docSnap.data() });
        });

        bills.sort((a, b) => new Date(a.date) - new Date(b.date));

        const today = new Date();
        today.setHours(0,0,0,0);

        let totalUnpaid = 0;
        let overviewHTML = '';
        let pageHTML = '';

        let filteredOverview = bills.filter(b => !b.paid && (new Date(b.date) - today) / (1000 * 60 * 60 * 24) <= 21);

        if (filteredOverview.length === 0) {
            overviewContainer.innerHTML = 'Nessuna bolletta in scadenza imminente.';
        } else {
            filteredOverview.forEach(b => {
                const diffDays = Math.ceil((new Date(b.date) - today) / (1000 * 60 * 60 * 24));
                let badgeClass = 'badge-green';
                let badgeText = `Scade tra ${diffDays} giorni`;

                if (diffDays < 0) {
                    badgeClass = 'badge-red';
                    badgeText = `Scaduta da ${Math.abs(diffDays)} giorni!`;
                } else if (diffDays <= 7) {
                    badgeClass = 'badge-red';
                    badgeText = `Scade tra ${diffDays} giorni`;
                } else if (diffDays <= 14) {
                    badgeClass = 'badge-orange';
                    badgeText = `Scade tra ${diffDays} giorni`;
                }

                overviewHTML += `
                    <div class="bill-row" style="padding: 8px 0;">
                        <span><b>${b.title}</b><br><small style="color:var(--text-muted);">${b.amount.toFixed(2)} €</small></span>
                        <span class="bill-badge ${badgeClass}">${badgeText}</span>
                    </div>
                `;
            });
            overviewContainer.innerHTML = overviewHTML;
        }

        bills.forEach(b => {
            if (!b.paid) totalUnpaid += b.amount;

            const diffDays = Math.ceil((new Date(b.date) - today) / (1000 * 60 * 60 * 24));
            let badgeClass = 'badge-green';
            let badgeText = `Scade tra ${diffDays} gg`;

            if (b.paid) {
                badgeClass = 'badge-gray';
                badgeText = 'Pagata';
            } else if (diffDays < 0) {
                badgeClass = 'badge-red';
                badgeText = `Scaduta (${Math.abs(diffDays)}g)`;
            } else if (diffDays <= 7) {
                badgeClass = 'badge-red';
                badgeText = `Scade tra ${diffDays} gg`;
            } else if (diffDays <= 14) {
                badgeClass = 'badge-orange';
                badgeText = `Scade tra ${diffDays} gg`;
            }

            pageHTML += `
                <div class="bill-row">
                    <span><b>${b.title}</b> — <span style="font-weight:600; color:var(--primary);">${b.amount.toFixed(2)} €</span><br><small style="color:var(--text-muted);">Scadenza: ${b.date}</small></span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="bill-badge ${badgeClass}">${badgeText}</span>
                        ${!b.paid ? `<button class="btn-success" onclick="toggleBillPaid('${b.id}', true)">Paga</button>` : `<button class="btn-danger" onclick="toggleBillPaid('${b.id}', false)">Annulla</button>`}
                        <button class="btn-danger" style="padding: 6px 8px;" onclick="deleteBill('${b.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        pageContainer.innerHTML = pageHTML || 'Nessuna bolletta inserita.';
        pageTotalAmount.innerText = `${totalUnpaid.toFixed(2)} €`;

        if (totalUnpaid > 0) {
            overviewTotalBox.style.display = 'flex';
            overviewTotalAmount.innerText = `${totalUnpaid.toFixed(2)} €`;
        } else {
            overviewTotalBox.style.display = 'none';
        }

    } catch (err) {
        console.error("Errore caricamento bollette:", err);
        overviewContainer.innerHTML = 'Errore nel caricamento bollette.';
    }
}

window.toggleBillPaid = async function(id, paidStatus) {
    try {
        const { db, firebaseFns } = window;
        const { doc, getDoc, setDoc } = firebaseFns;
        const billRef = doc(db, "bills", id);
        const billSnap = await getDoc(billRef);
        if (billSnap.exists()) {
            const data = billSnap.data();
            await setDoc(billRef, { ...data, paid: paidStatus });
            loadBills();
        }
    } catch (err) {
        console.error(err);
        alert("Errore nell'aggiornamento della bolletta.");
    }
}

window.deleteBill = async function(id) {
    if (confirm("Vuoi eliminare questa bolletta?")) {
        try {
            const { db, firebaseFns } = window;
            const { doc, deleteDoc } = firebaseFns;
            await deleteDoc(doc(db, "bills", id));
            loadBills();
        } catch (err) {
            console.error(err);
            alert("Errore durante l'eliminazione.");
        }
    }
}

// ================= CALENDARIO =================
document.getElementById('btn-add-event').addEventListener('click', async () => {
    const editId = document.getElementById('event-edit-id').value;
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const desc = document.getElementById('event-desc').value.trim();

    if (!title || !date) {
        alert("Inserisci almeno il titolo e la data dell'appuntamento.");
        return;
    }

    try {
        const { db, firebaseFns } = window;
        const { doc, setDoc, addDoc, collection, getDoc } = firebaseFns;

        if (editId) {
            const eventRef = doc(db, "events", editId);
            const snap = await getDoc(eventRef);
            let likes = snap.exists() && snap.data().likes ? snap.data().likes : [];
            await setDoc(eventRef, { title, date, time, desc, likes });
            cancelEditEvent();
        } else {
            await addDoc(collection(db, "events"), { title, date, time, desc, likes: [] });
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = '';
            document.getElementById('event-time').value = '';
            document.getElementById('event-desc').value = '';
        }
        loadEvents();
    } catch (err) {
        console.error(err);
        alert("Errore nel salvataggio dell'appuntamento.");
    }
});

async function loadEvents() {
    const overviewContainer = document.getElementById('overview-events-list');
    const pageContainer = document.getElementById('calendar-list-container');

    if (!window.db) return;

    try {
        const { db, firebaseFns } = window;
        const { collection, getDocs } = firebaseFns;

        const querySnapshot = await getDocs(collection(db, "events"));
        let events = [];

        querySnapshot.forEach((docSnap) => {
            events.push({ id: docSnap.id, ...docSnap.data() });
        });

        events.sort((a, b) => new Date(a.date + (a.time ? ' ' + a.time : '')) - new Date(b.date + (b.time ? ' ' + b.time : '')));

        const today = new Date();
        today.setHours(0,0,0,0);

        let overviewHTML = '';
        let pageHTML = '';

        let upcomingEvents = events.filter(e => new Date(e.date) >= today);

        if (upcomingEvents.length === 0) {
            overviewContainer.innerHTML = 'Nessun appuntamento in programma.';
        } else {
            upcomingEvents.slice(0, 3).forEach(e => {
                overviewHTML += `
                    <div class="event-row" style="padding: 8px 0;">
                        <span><b>${e.title}</b><br><small style="color:var(--text-muted);">${e.date} ${e.time ? '• ' + e.time : ''}</small></span>
                    </div>
                `;
            });
            overviewContainer.innerHTML = overviewHTML;
        }

        events.forEach(e => {
            const likes = e.likes || [];
            const userLiked = likes.includes(loggedUser);
            pageHTML += `
                <div class="event-row">
                    <span><b>${e.title}</b> — <span style="color:var(--primary); font-weight:600;">${e.date} ${e.time ? 'alle ' + e.time : ''}</span><br><small style="color:var(--text-muted);">${e.desc || 'Nessuna nota'}</small></span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="like-btn ${userLiked ? 'liked' : ''}" onclick="toggleLike('events', '${e.id}')" title="Mi piace"><i class="fa-solid fa-heart"></i></button>
                        <button class="btn-warning" style="padding: 6px 8px;" onclick="editEvent('${e.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-danger" style="padding: 6px 8px;" onclick="deleteEvent('${e.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });

        pageContainer.innerHTML = pageHTML || 'Nessun appuntamento inserito.';

    } catch (err) {
        console.error("Errore caricamento eventi:", err);
        overviewContainer.innerHTML = 'Errore nel caricamento appuntamenti.';
    }
}

window.editEvent = async function(id) {
    try {
        const { db, firebaseFns } = window;
        const { doc, getDoc } = firebaseFns;
        const snap = await getDoc(doc(db, "events", id));
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById('event-edit-id').value = id;
            document.getElementById('event-title').value = data.title || '';
            document.getElementById('event-date').value = data.date || '';
            document.getElementById('event-time').value = data.time || '';
            document.getElementById('event-desc').value = data.desc || '';
            document.getElementById('event-form-title').innerText = 'Modifica Appuntamento';
            document.getElementById('btn-add-event').innerText = 'Aggiorna Appuntamento';
            document.getElementById('btn-cancel-event').style.display = 'inline-block';
            document.querySelector('.content-body').scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch(err) { console.error(err); }
}

window.cancelEditEvent = function() {
    document.getElementById('event-edit-id').value = '';
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-desc').value = '';
    document.getElementById('event-form-title').innerText = 'Nuovo Appuntamento';
    document.getElementById('btn-add-event').innerText = 'Aggiungi al Calendario';
    document.getElementById('btn-cancel-event').style.display = 'none';
}

window.deleteEvent = async function(id) {
    if (confirm("Vuoi eliminare questo appuntamento?")) {
        try {
            const { db, firebaseFns } = window;
            const { doc, deleteDoc } = firebaseFns;
            await deleteDoc(doc(db, "events", id));
            loadEvents();
        } catch (err) { console.error(err); }
    }
}

// ================= RICETTARIO =================
document.getElementById('btn-add-recipe').addEventListener('click', async () => {
    const editId = document.getElementById('recipe-edit-id').value;
    const title = document.getElementById('recipe-title').value.trim();
    const category = document.getElementById('recipe-category').value;
    const ingredients = document.getElementById('recipe-ingredients').value.trim();
    const steps = document.getElementById('recipe-steps').value.trim();

    if (!title || !ingredients || !steps) {
        alert("Compila tutti i campi per salvare la ricetta.");
        return;
    }

    try {
        const { db, firebaseFns } = window;
        const { doc, setDoc, addDoc, collection, getDoc } = firebaseFns;

        if (editId) {
            const recipeRef = doc(db, "recipes", editId);
            const snap = await getDoc(recipeRef);
            let likes = snap.exists() && snap.data().likes ? snap.data().likes : [];
            awai
