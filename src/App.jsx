
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("dashboard");

  const [emailConnexion, setEmailConnexion] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [inscription, setInscription] = useState(false);

  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);

  const [nomProduit, setNomProduit] = useState("");
  const [prixProduit, setPrixProduit] = useState("");
  const [stockProduit, setStockProduit] = useState("");
  const [editionProduit, setEditionProduit] = useState(null);

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [courriel, setCourriel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [notes, setNotes] = useState("");
  const [editionClient, setEditionClient] = useState(null);

  useEffect(() => {
    let actif = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!actif) return;
      if (error) setError(error.message);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!actif) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      actif = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) chargerDonnees();
  }, [user]);

  async function chargerDonnees() {
    setError("");

    const { data: listeProduits, error: erreurProduits } =
      await supabase
        .from("produits")
        .select("*")
        .eq("user_id", user.id);

    if (erreurProduits) {
      setError("Produits : " + erreurProduits.message);
    } else {
      setProduits(listeProduits || []);
    }

    const { data: listeClients, error: erreurClients } =
      await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id);

    if (erreurClients) {
      setError("Clients : " + erreurClients.message);
    } else {
      setClients(listeClients || []);
    }
  }

  async function connexion(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const action = inscription
      ? supabase.auth.signUp({
          email: emailConnexion.trim(),
          password: motDePasse
        })
      : supabase.auth.signInWithPassword({
          email: emailConnexion.trim(),
          password: motDePasse
        });

    const { error } = await action;

    if (error) setError(error.message);
    else if (inscription)
      setMessage("Inscription envoyée. Vérifie ton e-mail si demandé.");
    else setMessage("Connexion réussie.");

    setBusy(false);
  }

  async function deconnexion() {
    setError("");
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  function viderProduit() {
    setNomProduit("");
    setPrixProduit("");
    setStockProduit("");
    setEditionProduit(null);
  }

  async function enregistrerProduit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const donnees = {
      user_id: user.id,
      nom: nomProduit.trim(),
      prix: Number(prixProduit),
      quantite_stock: Number(stockProduit)
    };

    let resultat;

    if (editionProduit) {
      resultat = await supabase
        .from("produits")
        .update(donnees)
        .eq("id", editionProduit)
        .eq("user_id", user.id);
    } else {
      resultat = await supabase
        .from("produits")
        .insert([donnees]);
    }

    if (resultat.error) {
      setError(resultat.error.message);
    } else {
      setMessage("Produit enregistré avec succès.");
      viderProduit();
      await chargerDonnees();
    }

    setBusy(false);
  }

  function modifierProduit(p) {
    setEditionProduit(p.id);
    setNomProduit(p.nom || "");
    setPrixProduit(String(p.prix ?? ""));
    setStockProduit(String(p.quantite_stock ?? ""));
    setPage("produits");
  }

  async function supprimerProduit(id) {
    if (!window.confirm("Supprimer ce produit ?")) return;

    setError("");
    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) setError(error.message);
    else {
      setMessage("Produit supprimé.");
      await chargerDonnees();
    }
  }

  function viderClient() {
    setNomClient("");
    setTelephone("");
    setCourriel("");
    setAdresse("");
    setNotes("");
    setEditionClient(null);
  }

  async function enregistrerClient(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const donnees = {
      user_id: user.id,
      nom_complet: nomClient.trim(),
      "téléphone": telephone.trim(),
      email: courriel.trim(),
      adresse: adresse.trim(),
      notes: notes.trim()
    };

    let resultat;

    if (editionClient) {
      resultat = await supabase
        .from("clients")
        .update(donnees)
        .eq("id", editionClient)
        .eq("user_id", user.id);
    } else {
      resultat = await supabase
        .from("clients")
        .insert([donnees]);
    }

    if (resultat.error) {
      setError("Enregistrement du client : " + resultat.error.message);
    } else {
      setMessage("Client enregistré avec succès.");
      viderClient();
      await chargerDonnees();
    }

    setBusy(false);
  }

  function modifierClient(c) {
    setEditionClient(c.id);
    setNomClient(c.nom_complet || "");
    setTelephone(c["téléphone"] || "");
    setCourriel(c.email || "");
    setAdresse(c.adresse || "");
    setNotes(c.notes || "");
    setPage("clients");
  }

  async function supprimerClient(id) {
    if (!window.confirm("Supprimer ce client ?")) return;

    setError("");
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) setError(error.message);
    else {
      setMessage("Client supprimé.");
      await chargerDonnees();
    }
  }

  const valeurStock = produits.reduce(
    (total, p) =>
      total + Number(p.prix || 0) * Number(p.quantite_stock || 0),
    0
  );

  if (loading) {
    return <div className="app-loading">Chargement de SELL PILOT AI...</div>;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={connexion}>
          <div className="brand-mark">SP</div>
          <h1>SELL PILOT AI</h1>
          <p>La gestion intelligente de votre commerce.</p>

          <h2>{inscription ? "Créer un compte" : "Connexion"}</h2>

          <label>Adresse e-mail</label>
          <input
            type="email"
            required
            value={emailConnexion}
            onChange={(e) => setEmailConnexion(e.target.value)}
            placeholder="Votre adresse e-mail"
          />

          <label>Mot de passe</label>
          <input
            type="password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="Votre mot de passe"
          />

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button className="primary-button" disabled={busy}>
            {busy
              ? "Patientez..."
              : inscription
              ? "Créer mon compte"
              : "Se connecter"}
          </button>

          <button
            type="button"
            className="link-button"
            onClick={() => {
              setInscription(!inscription);
              setError("");
              setMessage("");
            }}
          >
            {inscription
              ? "J'ai déjà un compte"
              : "Créer un nouveau compte"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div>
            <strong>SELL PILOT AI</strong>
            <small>Business management</small>
          </div>
        </div>

        <nav className="navigation">
          {[
            ["dashboard", "Tableau de bord"],
            ["produits", "Produits"],
            ["clients", "Clients"],
            ["commandes", "Commandes"],
            ["ventes", "Ventes"],
            ["factures", "Factures"]
          ].map(([id, titre]) => (
            <button
              key={id}
              className={page === id ? "nav-link active" : "nav-link"}
              onClick={() => {
                setPage(id);
                setError("");
                setMessage("");
              }}
            >
              {titre}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <small>{user.email}</small>
          <button className="logout-button" onClick={deconnexion}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">ESPACE PROFESSIONNEL</span>
            <h1>
              {page === "dashboard"
                ? "Tableau de bord"
                : page === "produits"
                ? "Gestion des produits"
                : page === "clients"
                ? "Gestion des clients"
                : page === "commandes"
                ? "Commandes"
                : page === "ventes"
                ? "Ventes"
                : "Factures"}
            </h1>
          </div>
          <div className="user-avatar">SP</div>
        </header>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {page === "dashboard" && (
          <>
            <section className="welcome-card">
              <div>
                <span>BIENVENUE SUR VOTRE ESPACE</span>
                <h2>Pilotez votre commerce simplement.</h2>
                <p>Retrouvez vos informations essentielles au même endroit.</p>
              </div>
              <div className="welcome-icon">✦</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>Produits</span>
                <strong>{produits.length}</strong>
              </div>
              <div className="stat-card">
                <span>Clients</span>
                <strong>{clients.length}</strong>
              </div>
              <div className="stat-card">
                <span>Unités en stock</span>
                <strong>
                  {produits.reduce(
                    (total, p) => total + Number(p.quantite_stock || 0),
                    0
                  )}
                </strong>
              </div>
              <div className="stat-card">
                <span>Valeur du stock</span>
                <strong>{valeurStock.toLocaleString("fr-FR")} F CFA</strong>
              </div>
            </section>

            <section className="panel">
              <h2>Accès rapide</h2>
              <div className="quick-actions">
                <button onClick={() => setPage("produits")}>
                  + Ajouter un produit
                </button>
                <button onClick={() => setPage("clients")}>
                  + Ajouter un client
                </button>
              </div>
            </section>
          </>
        )}

        {page === "produits" && (
          <section className="panel">
            <h2>{editionProduit ? "Modifier le produit" : "Ajouter un produit"}</h2>

            <form className="data-form" onSubmit={enregistrerProduit}>
              <label>Nom du produit</label>
              <input
                required
                value={nomProduit}
                onChange={(e) => setNomProduit(e.target.value)}
                placeholder="Exemple : Sac"
              />

              <label>Prix</label>
              <input
                required
                type="number"
                min="0"
                value={prixProduit}
                onChange={(e) => setPrixProduit(e.target.value)}
                placeholder="Prix"
              />

              <label>Quantité en stock</label>
              <input
                required
                type="number"
                min="0"
                value={stockProduit}
                onChange={(e) => setStockProduit(e.target.value)}
                placeholder="Quantité"
              />

              <button className="primary-button" disabled={busy}>
                {busy ? "Enregistrement..." : editionProduit ? "Enregistrer les modifications" : "Ajouter le produit"}
              </button>

              {editionProduit && (
                <button type="button" className="secondary-button" onClick={viderProduit}>
                  Annuler
                </button>
              )}
            </form>

            <h2>Liste des produits</h2>
            <div className="table-list">
              {produits.map((p) => (
                <article className="list-item" key={p.id}>
                  <div>
                    <strong>{p.nom}</strong>
                    <p>{Number(p.prix).toLocaleString("fr-FR")} F CFA · Stock : {p.quantite_stock}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => modifierProduit(p)}>Modifier</button>
                    <button className="delete-button" onClick={() => supprimerProduit(p.id)}>Supprimer</button>
                  </div>
                </article>
              ))}
              {produits.length === 0 && <p>Aucun produit enregistré.</p>}
            </div>
          </section>
        )}

        {page === "clients" && (
          <section className="panel">
            <h2>{editionClient ? "Modifier le client" : "Ajouter un client"}</h2>

            <form className="data-form" onSubmit={enregistrerClient}>
              <label>Nom complet</label>
              <input
                required
                value={nomClient}
                onChange={(e) => setNomClient(e.target.value)}
                placeholder="Nom du client"
              />

              <label>Téléphone</label>
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Numéro de téléphone"
              />

              <label>Courriel</label>
              <input
                type="email"
                value={courriel}
                onChange={(e) => setCourriel(e.target.value)}
                placeholder="Adresse e-mail"
              />

              <label>Adresse</label>
              <input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Adresse du client"
              />

              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires"
              />

              <button className="primary-button" disabled={busy}>
                {busy
                  ? "Enregistrement..."
                  : editionClient
                  ? "Enregistrer les modifications"
                  : "Enregistrer le client"}
              </button>

              {editionClient && (
                <button type="button" className="secondary-button" onClick={viderClient}>
                  Annuler
                </button>
              )}
            </form>

            <h2>Liste des clients</h2>
            <div className="table-list">
              {clients.map((c) => (
                <article className="list-item" key={c.id}>
                  <div>
                    <strong>{c.nom_complet}</strong>
                    <p>{c["téléphone"] || "Pas de téléphone"}</p>
                    <p>{c.email || "Pas de courriel"}</p>
                    <p>{c.adresse || ""}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => modifierClient(c)}>Modifier</button>
                    <button className="delete-button" onClick={() => supprimerClient(c.id)}>
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
              {clients.length === 0 && <p>Aucun client enregistré.</p>}
            </div>
          </section>
        )}

        {["commandes", "ventes", "factures"].includes(page) && (
          <section className="panel coming-soon">
            <h2>Cette fonctionnalité arrive bientôt.</h2>
            <p>Nous préparons cette partie de SELL PILOT AI.</p>
          </section>
        )}
      </main>
    </div>
  );
}
