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

window.addEventListener('firebase-ready', async () => {
    const { db, firebaseFns } = window;
    const { doc, getDoc, setDoc } = firebaseFns;

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

    const savedEmail = localStorage.getItem('family_user_email');
    const savedPass = localStorage.getItem('family_user_pass');
    if (savedEmail && savedPass) {
        document.getElementById('auth-email').value = savedEmail;
        document.getElementById('auth-password').value = savedPass;
        document.getElementById('remember-me').checked = true;
    }

    loadBills();
});

document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('auth-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

async function handleLogin() {
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value.trim();
    const remember = document.getElementById('remember-me').checked;
    const errorBox = document.getElementById('error-message');

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
    document.getElementById(targetId).classList.add('active');
    
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

document.getElementById('btn-add-member').addEventListener('click', async () => {
    const name = document.getElementById('new-member-name').value.trim();
    const email = document.getElementById('new-member-email').value.trim().toLowerCase();
    const pass = document.getElementById('new-member-pass').value.trim();
    const role = document.getElementById('new-member-role').value;
    
    const permissions = [];
    document.querySelectorAll('.perm-chk:checked').forEach(chk => {
        permissions.push(chk.value);
    });

    if (!name || !email || !pass) {
        alert("Compila tutti i campi obbligatori per aggiungere/modificare il membro.");
        return;
    }

    try {
        const { db, firebaseFns } = window;
        const { doc, setDoc } = firebaseFns;

        await setDoc(doc(db, "users", email), { name, pass, role, permissions });
        alert(`Membro ${name} salvato con successo!`);
        
        cancelEditMember();
        loadMembersList();
    } catch (err) {
        console.error(err);
        alert("Errore durante il salvataggio.");
    }
});

window.editMember = async function(email) {
    try {
        const { db, firebaseFns } = window;
        const { doc, getDoc } = firebaseFns;
        const userSnap = await getDoc(doc(db, "users", email));

        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById('new-member-name').value = data.name || '';
            document.getElementById('new-member-email').value = email;
            document.getElementById('new-member-email').disabled = true;
            document.getElementById('new-member-pass').value = data.pass || '';
            document.getElementById('new-member-role').value = data.role || 'Member';

            const perms = data.permissions || [];
            document.querySelectorAll('.perm-chk').forEach(chk => {
                chk.checked = perms.includes(chk.value);
            });

            document.getElementById('admin-form-title').innerText = `Modifica permessi: ${data.name}`;
            document.getElementById('admin-form-subtitle').innerText = `Aggiorna i dati o i permessi per ${email}.`;
            document.getElementById('btn-add-member').innerText = 'Aggiorna Membro';
            document.getElementById('btn-cancel-edit').style.display = 'inline-block';

            document.querySelector('.content-body').scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (err) {
        console.error(err);
        alert("Errore nel recupero dei dati del membro.");
    }
}

window.cancelEditMember = function() {
    document.getElementById('new-member-name').value = '';
    document.getElementById('new-member-email').value = '';
    document.getElementById('new-member-email').disabled = false;
    document.getElementById('new-member-pass').value = '';
    document.getElementById('new-member-role').value = 'Member';
    document.querySelectorAll('.perm-chk').forEach(chk => { chk.checked = true; });

    document.getElementById('admin-form-title').innerText = 'Gestione membri e permessi';
    document.getElementById('admin-form-subtitle').innerText = 'Aggiungi familiari e scegli quali sezioni possono vedere.';
    document.getElementById('btn-add-member').innerText = 'Salva Membro';
    document.getElementById('btn-cancel-edit').style.display = 'none';
}

async function loadMembersList() {
    const container = document.getElementById('members-list-container');
    container.innerHTML = 'Caricamento membri in corso...';
    try {
        const { db, firebaseFns } = window;
        const { collection, getDocs } = firebaseFns;

        const querySnapshot = await getDocs(collection(db, "users"));
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = 'Nessun membro trovato.';
            return;
        }

        querySnapshot.forEach((documentSnap) => {
            const data = documentSnap.data();
            const email = documentSnap.id;
            const name = data.name || 'Senza nome';
            const role = data.role || 'Member';
            const perms = data.permissions ? data.permissions.length : 4;

            const row = document.createElement('div');
            row.className = 'member-row';
            row.innerHTML = `
                <span><b>${name}</b><br><span style="color:var(--text-muted); font-size:12px;">${email} (${role} • ${perms} sezioni)</span></span>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-warning" onclick="editMember('${email}')"><i class="fa-solid fa-pen"></i> Modifica</button>
                    ${email !== 'stpa79@gmail.com' ? `<button class="btn-danger" onclick="deleteMember('${email}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            `;
            container.appendChild(row);
        });
    } catch (err) {
        console.error("Errore caricamento membri:", err);
        container.innerHTML = 'Errore nel caricamento membri.';
    }
}

window.deleteMember = async function(email) {
    if(confirm(`Vuoi davvero eliminare l'accesso per ${email}?`)) {
        try {
            const { db, firebaseFns } = window;
            const { doc, deleteDoc } = firebaseFns;
            await deleteDoc(doc(db, "users", email));
            loadMembersList();
        } catch(err) {
            console.error(err);
            alert("Errore durante l'eliminazione.");
        }
    }
}

document.getElementById('gemini-send').addEventListener('click', askGemini);
document.getElementById('gemini-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') askGemini(); });
document.getElementById('close-gemini').addEventListener('click', () => { document.getElementById('gemini-response-box').style.display = 'none'; });

function askGemini() {
    const query = document.getElementById('gemini-input').value.trim();
    if (!query) return;
    const responseBox = document.getElementById('gemini-response-box');
    const answerBox = document.getElementById('gemini-answer');
    responseBox.style.display = 'block';
    answerBox.innerHTML = "Sto elaborando la risposta...";

    setTimeout(() => {
        answerBox.innerHTML = `Ciao ${loggedUser}! Ho ricevuto la tua richiesta: "${query}". Sono qui per aiutarti a gestire tutto nel portale della famiglia!`;
    }, 600);
}
