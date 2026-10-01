// --- IMPORTAZIONE E CONFIGURAZIONE FIREBASE ---
// Carichiamo le librerie di Firebase via script nel DOM se non presenti, oppure usiamo direttamente gli oggetti globali.
// Inseriamo la configurazione del tuo progetto "sito-famiglia":
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.firebasestorage.app",
    messagingSenderId: "932164677551",
    appId: "1:932164677551:web:993005284551ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

// Inizializzazione delle funzioni base (assicurati di includere gli script SDK di Firebase nel file principale se lo testi in locale)
// Esempio di gestione interfaccia:
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function cambiaColore() {
    const nuovoColore = document.getElementById('colorPicker').value;
    document.documentElement.style.setProperty('--primary-color', nuovoColore);
    toggleSettings();
}

function impostaUtente(nome, genere) {
    const saluto = (genere === 'F') ? 'Benvenuta' : 'Benvenuto';
    document.getElementById('welcome-message').innerText = `${saluto}, ${nome}!`;
}

// Gestione della chat testuale
function inviaMessaggio() {
    const inputField = document.getElementById('userInput');
    const testo = inputField.value.trim();
    if (testo === '') return;

    aggiungiMessaggioChat(testo, 'user-msg');
    inputField.value = '';

    setTimeout(() => {
        const risposta = generaRisposta(testo);
        aggiungiMessaggioChat(risposta, 'gemini-msg');
        parlaTesto(risposta);
    }, 500);
}

function controllaInvio(event) {
    if (event.key === 'Enter') {
        inviaMessaggio();
    }
}

function aggiungiMessaggioChat(testo, classe) {
    const chatBox = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = classe;
    msgDiv.innerText = testo;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function generaRisposta(testo) {
    const t = testo.toLowerCase();
    if (t.includes('ciao') || t.includes('salve')) {
        return 'Ciao Stecks! Firebase è attivo. Come va in famiglia?';
    } else if (t.includes('ricetta') || t.includes('frollini') || t.includes('churros')) {
        return 'Mmmh, sento odor di dolci! Le salveremo nel cloud di famiglia.';
    } else if (t.includes('scadenza') || t.includes('bolletta')) {
        return 'Controllo le scadenze sincronizzate dal database!';
    } else {
        return `Ho registrato la richiesta: "${testo}". Perfetto per il nostro hub!`;
    }
}

// --- FUNZIONI VOCALI ---
function parlaTesto(testo) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(testo);
        utterance.lang = 'it-IT';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

function avviaAscoltoVocale() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Il tuo browser non supporta il riconoscimento vocale diretto. Usa Google Chrome!");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const statusP = document.getElementById('voiceStatus');
    statusP.innerText = "🎤 Ti sto ascoltando, parla pure...";

    recognition.start();

    recognition.onresult = function(event) {
        const testoSpoken = event.results[0][0].transcript;
        statusP.innerText = `Hai detto: "${testoSpoken}"`;
        
        aggiungiMessaggioChat(testoSpoken, 'user-msg');
        
        setTimeout(() => {
            const risposta = generaRisposta(testoSpoken);
            aggiungiMessaggioChat(risposta, 'gemini-msg');
            parlaTesto(risposta);
        }, 500);
    };

    recognition.onerror = function(event) {
        statusP.innerText = "Ops, non ho capito bene. Riprova!";
    };

    recognition.onspeechend = function() {
        setTimeout(() => {
            statusP.innerText = "";
        }, 3000);
    };
}
