<div align="center">
  <h1>🏋️ Trainly</h1>
  <p>
    Una piattaforma E-commerce web completa per il fitness, dedicata alla vendita di prodotti e servizi digitali.
    <br />
    <br />
    <img src="https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node Version">
    <img src="https://img.shields.io/badge/Express-MVC-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
    <img src="https://img.shields.io/badge/DB-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  </p>
</div>

---

## 🧐 Di cosa si tratta?

Questo progetto implementa una **Web App E-commerce** dinamica e responsive. È progettata per gestire l'intero ciclo di vita di un acquisto online, dalla navigazione del catalogo fino alla gestione degli ordini, con aree riservate per utenti e amministratori.

Le funzionalità principali includono:
* **Catalogo Dinamico:** Esplorazione e ricerca prodotti gestita tramite template engine EJS.
* **Gestione Carrello:** Aggiunta e rimozione prodotti con calcolo automatico dei totali.
* **Area Amministrativa:** Pannello di controllo per gestire prodotti (CRUD completo) e visualizzare gli ordini degli utenti.

---

## 🛠️ Funzionalità del Codice

Il core del progetto è basato su **Express.js** e organizzato secondo il pattern MVC. Ecco i moduli principali disponibili:

- `Autenticazione`: Gestione sicura di login e registrazione tramite **Passport.js** e hashing delle password con **Bcrypt**.
- `Gestione Prodotti`: API per creare, modificare ed eliminare articoli dal database SQLite (`products` table).
- `Sistema Ordini`: Logica per convertire il contenuto del carrello (`cart_items`) in un ordine confermato (`orders`).
- `Middleware`: Controllo degli accessi per proteggere le route sensibili (es. solo Admin).
- `Database`: Utilizzo di **SQLite** per un'archiviazione dati leggera e portabile senza configurazioni complesse.

---

## 🚀 Esempio di Utilizzo (Account Test)

Per utilizzare l'applicazione e testare i diversi ruoli, utilizza le seguenti credenziali pre-configurate:

| Ruolo | Email | Password |
| :--- | :--- | :--- |
| 👑 **Admin** | `admin@trainly.com` | `Admin123!` |
| 🧑 **User** | `albitres2004@gmail.com` | `Test123!` |
| 🧑 **User** | `lucia.bianchi@gmail.com` | `Test123!` |

---

## 📂 Struttura del Progetto

Ecco come è organizzato il codice sorgente:

```text
trainly/
├── 📁 bin/
│   └── 📄 www                 # Script di avvio del server
├── 📁 middleware/
│   ├── 📄 autorizzazioni.js   # Gestione permessi (isAuthenticated, isAdmin)
│   └── 📄 passport.js         # Strategia di autenticazione locale
├── 📁 models/
│   └── 📁 dao/            # Data Access Objects per le operazioni sul DB
├── 📁 public/             # File statici (CSS, JS client, immagini)
├── 📁 routes/             # Gestione delle route per le pagine e le API
├── 📁 views/              # Viste EJS (template HTML)
│   └── 📁 partials/       # Componenti riutilizzabili (header footer, ...)
├── 📄 app.js              # File principale di configurazione Express
├── 📄 db.js               # Gestione della connessione e inizializzazione del DB
├── 📄 schema.sql          # Schema del database SQLite
├── 📄 package.json        # Dipendenze e script del progetto
└── 📄 .env.example        # Template per le variabili d'ambiente
```

## Schema del Database

Il database `SQLite` è organizzato nelle seguenti tabelle principali:

  - `users`: Memorizza i dati degli utenti (inclusi gli admin)
  - `products`: Contiene il catalogo di tutti i prodotti digitali in vendita
  - `orders` e `order_items`: Gestiscono gli ordini e i prodotti associati
  - `cart_items`: Salva il contenuto del carrello per gli utenti registrati
  - `newsletter`: Lista delle email iscritte alla newsletter

Per una visione completa della struttura, consulta il file schema.sql

## Video Dimostrativo

Guarda il video che mostra le principali funzionalità di **Trainly** in azione\!

**[Guarda il video]** https://youtu.be/ZLD7Dgu3Zag
