document.addEventListener("DOMContentLoaded", () => {
  const isLogged = localStorage.getItem("sitoFamiglia_logged");
  const username = localStorage.getItem("sitoFamiglia_user");
  const ruolo = localStorage.getItem("sitoFamiglia_ruolo");
  const permessi = JSON.parse(localStorage.getItem("sitoFamiglia_permessi") || "{}");

  if (!isLogged || !username) {
    window.location.href = "login/login.html";
    return;
  }

  const loggedUserName = document.getElementById("logged-user-name");
  if (loggedUserName) {
    loggedUserName.textContent = username.charAt(0).toUpperCase() + username.slice(1);
  }

  // Permessi visibilità
  const navUtenti = document.getElementById("nav-utenti");
  if (ruolo === "admin" && navUtenti) navUtenti.style.display = "flex";

  const navScadenze = document.getElementById("nav-scadenze");
  if (permessi.scadenze === false && navScadenze) navScadenze.style.display = "none";

  const navImpegni = document.getElementById("nav-impegni");
  if (permessi.impegni === false && navImpegni) navImpegni.style.display = "none";

  const navRicette = document.getElementById("nav-ricette");
  if (permessi.ricette === false && navRicette) navRicette.style.display = "none";

  const navMedia = document.getElementById("nav-media");
  if (permessi.media === false && navMedia) navMedia.style.display = "none";

  // Menu Toggle
  const menuToggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("main-sidebar");

  if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Funzione globale per cambiare pagina nell'iframe
  window.cambiaPagina = function(pageKey) {
    const targetBtn = document.querySelector(`.nav-btn[data-nav="${pageKey}"]`);
    const telaIframe = document.getElementById("tela-iframe");
    const navButtons = document.querySelectorAll(".nav-btn");

    if (targetBtn && targetBtn.style.display !== "none") {
      const targetPage = targetBtn.getAttribute("data-page");
      if (targetPage && telaIframe) {
        telaIframe.src = targetPage;
        navButtons.forEach(btn => btn.classList.remove("active"));
        targetBtn.classList.add("active");
        if (sidebar) sidebar.classList.remove("open");
      }
    }
  };

  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const navKey = button.getAttribute("data-nav");
      window.cambiaPagina(navKey);
    });
  });

  // Logout
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login/login.html";
    });
  }
});
