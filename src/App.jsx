
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inscription, setInscription] = useState(false);

  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);

  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [produitId, setProduitId] = useState(null);

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [courriel, setCourriel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState(null);

  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      chargerProduits();
      chargerClients();
    } else {
      setProduits([]);
      setClients([]);
    }
  }, [user]);

  async function chargerProduits() {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setProduits(data || []);
  }

  async function chargerClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setClients(data || []);
  }

  async function connexion(e) {
    e.preventDefault();
    setChargement(true);
    setMessage("");

    const resultat = inscription
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setChargement(false);

    if (resultat.error) {
      setMessage(resultat.error.message);
    } else if (inscription) {
      setMessage("Inscription envoyée. Vérifie ton e-mail.");
    } else {
      setMessage("Connexion réussie !");
    }
  }

  function viderProduit() {
    setNom("");
    setPrix("");
    setStock("");
    setProduitId(null);
  }

  async function enregistrerProduit(e) {
    e.preventDefault();

    if (!nom.trim() || prix === "" || stock === "") {
      setMessage("Remplis tous les champs du produit.");
      return;
    }

    const valeurs = {
      nom: nom.trim(),
      prix: Number(prix),
      quantite_stock: Number(stock)
    };

    setChargement(true);

    const resultat = produitId
      ? await supabase.from("produits").update(valeurs).eq("id", produitId)
      : await supabase.from("produits").insert(valeurs);

    setChargement(false);

    if (resultat.error) {
      setMessage(resultat.error.message);
      return;
    }

    viderProduit();
    setMessage("Produit enregistré avec succès !");
    chargerProduits();
  }

  function modifierProduit(p) {
    setNom(p.nom || "");
    setPrix(String(p.prix ?? ""));
    setStock(String(p.quantite_stock ?? ""));
    setProduitId(p.id);
    document.getElementById("formulaire-produit")?.scrollIntoView();
  }

  async function supprimerProduit(id) {
    if (!window.confirm("Supprimer ce produit ?")) return;

    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", id);

    if (error) setMessage(error.message);
    else {
      setMessage("Produit supprimé.");
      chargerProduits();
    }
  }

  function viderClient() {
    setNomClient("");
    setTelephone("");
    setCourriel("");
    setAdresse("");
    setNotes("");
    setClientId(null);
  }

  async function enregistrerClient(e) {
    e.preventDefault();

    if (!nomClient.trim()) {
      setMessage("Saisis le nom du client.");
      return;
    }

    const valeurs = {
      user_id: user.id,
      nom_complet: nomClient.trim(),
      "téléphone": telephone.trim(),
      Email: courriel.trim(),
      adresse: adresse.trim(),
      notes: notes.trim()
    };

    setChargement(true);

    const resultat = clientId
      ? await supabase.from("clients").update(valeurs).eq("id", clientId)
      : await supabase.from("clients").insert(valeurs);

    setChargement(false);

    if (resultat.error) {
      setMessage(resultat.error.message);
      return;
    }

    viderClient();
    setMessage("Client enregistré avec succès !");
    chargerClients();
  }

  function modifierClient(c) {
    setNomClient(c.nom_complet || "");
    setTelephone(c["téléphone"] || "");
    setCourriel(c.Email || "");
    setAdresse(c.adresse || "");
    setNotes(c.notes || "");
    setClientId(c.id);
    document.getElementById("formulaire-client")?.scrollIntoView();
  }

  async function supprimerClient(id) {
    if (!window.confirm("Supprimer ce client ?")) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) setMessage(error.message);
    else {
      setMessage("Client supprimé.");
      chargerClients();
    }
  }

  async function deconnexion() {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
  }

  const totalStock = produits.reduce(
    (total, p) => total + Number(p.quantite_stock || 0),
    0
  );

  const valeurStock = produits.reduce(
    (total, p) =>
      total + Number(p.prix || 0) * Number(p.quantite_stock || 0),
    0
  );

  const formatPrix = (n) =>
    new Intl.NumberFormat("fr-FR").format(n) + " F CFA";

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-logo">SP</div>
          <h1>SELL PILOT AI</h1>
          <p className="auth-subtitle">
            Votre commerce, piloté intelligemment.
          </p>

          <h2>{inscription ? "Créer un compte" : "Bienvenue"}</h2>

          <form onSubmit={connexion}>
            <label>Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={chargement}>
              {chargement
                ? "Chargement..."
                : inscription
                  ? "Créer mon compte"
                  : "Se connecter"}
            </button>
          </form>

          <button
            className="auth-switch"
            onClick={() => {
              setInscription(!inscription);
              setMessage("");
            }}
          >
            {inscription ? "J'ai déjà un compte" : "Créer un nouveau compte"}
          </button>

          {message && <p className="notice">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">SP</div>
          <div>
            <strong>SELL PILOT AI</strong>
            <small>Business Manager</small>
          </div>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav className="navigation">
          <a className="nav-link active" href="#dashboard">▦ Tableau de bord</a>
          <a className="nav-link" href="#produits">▤ Produits</a>
          <a className="nav-link" href="#clients">♙ Clients</a>
          <span className="nav-link disabled">▣ Commandes <small>Bientôt</small></span>
          <span className="nav-link disabled">↗ Ventes <small>Bientôt</small></span>
          <span className="nav-link disabled">▧ Factures <small>Bientôt</small></span>
        </nav>

        <div className="sidebar-bottom">
          <span>● Connecté</span>
          <small>{user.email}</small>
          <button className="logout-button" onClick={deconnexion}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">ESPACE DE GESTION</span>
            <h1>Tableau de bord</h1>
            <p>Bienvenue dans votre espace de gestion.</p>
          </div>
          <div className="user-avatar">SP</div>
        </header>

        <section id="dashboard" className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Vue d'ensemble</h2>
              <p>Suivez votre activité commerciale.</p>
            </div>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon">▤</span>
              <p>Produits enregistrés</p>
              <h3>{produits.length}</h3>
              <small>Dans votre catalogue</small>
            </article>

            <article className="stat-card">
              <span className="stat-icon">▣</span>
              <p>Quantité en stock</p>
              <h3>{totalStock}</h3>
              <small>Unités enregistrées</small>
            </article>

            <article className="stat-card">
              <span className="stat-icon">◈</span>
              <p>Valeur du stock</p>
              <h3>{formatPrix(valeurStock)}</h3>
              <small>Valeur totale du catalogue</small>
            </article>

            <article className="stat-card">
              <span className="stat-icon">♙</span>
              <p>Clients enregistrés</p>
              <h3>{clients.length}</h3>
              <small>Dans votre fichier clients</small>
            </article>
          </div>
        </section>

        {message && <p className="notice">{message}</p>}

        <section id="produits" className="content-panel">
          <div className="section-heading">
            <div>
              <span className="topbar-label">CATALOGUE</span>
              <h2>Gestion des produits</h2>
              <p>Ajoutez et gérez les articles de votre commerce.</p>
            </div>
          </div>

          <form
            id="formulaire-produit"
            className="product-form"
            onSubmit={enregistrerProduit}
          >
            <h3>{produitId ? "Modifier le produit" : "Ajouter un produit"}</h3>

            <div className="form-grid">
              <div className="field">
                <label>Nom du produit</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>

              <div className="field">
                <label>Prix de vente</label>
                <input type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)} required />
              </div>

              <div className="field">
                <label>Quantité en stock</label>
                <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={chargement}>
                {chargement ? "Enregistrement..." : produitId ? "Modifier" : "+ Ajouter le produit"}
              </button>
              {produitId && (
                <button type="button" className="cancel-button" onClick={viderProduit}>
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div className="inventory-header">
            <div>
              <h3>Mon inventaire</h3>
              <p>{produits.length} produit(s) enregistré(s)</p>
            </div>
            <button className="refresh-button" onClick={chargerProduits}>
              Actualiser
            </button>
          </div>

          <div className="product-list">
            {produits.length === 0 ? (
              <div className="empty-state">Aucun produit enregistré.</div>
            ) : produits.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-icon">▤</div>
                <div className="product-info">
                  <strong>{p.nom}</strong>
                  <span className="product-price">{formatPrix(Number(p.prix))}</span>
                  <small className="product-stock">Stock : {p.quantite_stock}</small>
                </div>
                <div className="product-actions">
                  <button className="edit-button" onClick={() => modifierProduit(p)}>Modifier</button>
                  <button className="delete-button" onClick={() => supprimerProduit(p.id)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="clients" className="content-panel">
          <div className="section-heading">
            <div>
              <span className="topbar-label">RELATION CLIENT</span>
              <h2>Gestion des clients</h2>
              <p>Enregistrez et retrouvez les informations de vos clients.</p>
            </div>
          </div>

          <form
            id="formulaire-client"
            className="product-form"
            onSubmit={enregistrerClient}
          >
            <h3>{clientId ? "Modifier le client" : "Ajouter un client"}</h3>

            <div className="form-grid">
              <div className="field">
                <label>Nom complet</label>
                <input value={nomClient} onChange={(e) => setNomClient(e.target.value)} required />
              </div>

              <div className="field">
                <label>Téléphone</label>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </div>

              <div className="field">
                <label>Courriel</label>
                <input type="email" value={courriel} onChange={(e) => setCourriel(e.target.value)} />
              </div>

              <div className="field">
                <label>Adresse</label>
                <input value={adresse} onChange={(e) => setAdresse(e.target.value)} />
              </div>

              <div className="field">
                <label>Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={chargement}>
                {chargement ? "Enregistrement..." : clientId ? "Modifier le client" : "+ Ajouter le client"}
              </button>
              {clientId && (
                <button type="button" className="cancel-button" onClick={viderClient}>
                  Annuler
                </button>
              )}
            </div>
          </form>

          <div className="inventory-header">
            <div>
              <h3>Mes clients</h3>
              <p>{clients.length} client(s) enregistré(s)</p>
            </div>
            <button className="refresh-button" onClick={chargerClients}>
              Actualiser
            </button>
          </div>

          <div className="product-list">
            {clients.length === 0 ? (
              <div className="empty-state">Aucun client enregistré.</div>
            ) : clients.map((c) => (
              <article className="product-card" key={c.id}>
                <div className="product-icon">♙</div>
                <div className="product-info">
                  <strong>{c.nom_complet}</strong>
                  <span className="product-price">{c["téléphone"] || "Pas de téléphone"}</span>
                  <small className="product-stock">{c.Email || "Pas de courriel"}</small>
                  {c.adresse && <small className="product-stock">Adresse : {c.adresse}</small>}
                  {c.notes && <small className="product-stock">Notes : {c.notes}</small>}
                </div>
                <div className="product-actions">
                  <button className="edit-button" onClick={() => modifierClient(c)}>Modifier</button>
                  <button className="delete-button" onClick={() => supprimerClient(c.id)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="app-footer">
          SELL PILOT AI · Gestion intelligente de votre commerce
        </footer>
      </main>
    </div>
  );
}
