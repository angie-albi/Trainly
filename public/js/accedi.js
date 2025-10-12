document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validazione base lato client
    if (!email || !password) {
      showLoginErrorToast("Inserisci email e password");
      return;
    }

    try {
      const response = await fetch("/accedi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      // Controlla se la risposta è in formato JSON
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        
        if (data.success) {
          // Login riuscito - reindirizza
          window.location.href = data.redirect || '/profiloUtente';
        } else {
          // Login fallito - mostra toast errore
          showLoginErrorToast(data.message || "Credenziali errate");
        }
      } else if (response.redirected) {
        // Se il server ha fatto un redirect, seguilo
        window.location.href = response.url;
      } else {
        // Errore generico
        showLoginErrorToast("Errore durante il login. Riprova.");
      }
      
    } catch (err) {
      console.error("Errore login:", err);
      showLoginErrorToast("Si è verificato un errore di connessione.");
    }
  });

  function showLoginErrorToast(message) {
    let toastEl = document.getElementById("loginErrorToast");
    if (toastEl) {
      // Aggiorna il messaggio del toast
      toastEl.querySelector(".toast-body").textContent = message;
      
      // Crea e mostra il toast
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    } else {
      // Fallback: se il toast non esiste, mostra un alert
      alert(message);
    }
  }
});