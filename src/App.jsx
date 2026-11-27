
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
  const [page, setPage] = useState("dashboard");
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [connexionEmail, setConnexionEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inscription, setInscription] = useState(false);

  const [nomProduit, setNomProduit] = useState("");
  const [prixProduit, setPrixProduit] = useState("");
  const [stockProduit, setStockProduit] = useState("");
  const [editProduit, setEditProduit] = useState(null);

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [courriel, setCourriel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [notes, setNotes] = useState("");
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) chargerDonnees();
  }, [user]);

  async function chargerDonnees() {
    setError("");

    const p = await supabase.from("produits").select("*");
    if (p.error) setError("Produits : " + p.error.message);
    else setProduits(p.data || []);

    const c = await supabase.from("clients").select("*");
    if (c.error) setError("Clients : " + c.error.message);
    else setClients(c.data || []);
  }

  async function authentifier(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const result = inscription
      ? await supabase.auth.signUp({
          email: connexionEmail.trim(),
          password
        })
      : await supabase.auth.signInWithPassword({
          email: connexionEmail.trim(),
          password
        });

    if (result.error) setError(result.error.message);
    else if (inscription) {
      setMessage("Inscription envoyée. Vérifie ton e-mail si demandé.");
    } else {
      setMessage("Connexion réussie.");
    }

    setBusy(false);
  }

  async function deconnexion() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  function viderProduit() {
    setNomProduit("");
    setPrixProduit("");
    setStockProduit("");
    setEditProduit(null);
  }

  async function enregistrerProduit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const donnees = {
      nom: nomProduit.trim(),
      prix: Number(prixProduit),
      quantite_stock: Number(stockProduit)
    };

    const result = editProduit
      ? await supabase.from("produits").update(donnees).eq("id", editProduit)
      : await supabase.from("produits").insert([donnees]);

    if (result.error) {
      setError("Produit : " + result.error.message);
    } else {
      setMessage("Produit enregistré avec succès.");
      viderProduit();
      await chargerDonnees();
    }

    setBusy(false);
  }

  function modifierProduit(p) {
    setEditProduit(p.id);
    setNomProduit(p.nom || "");
    setPrixProduit(String(p.prix ?? ""));
    setStockProduit(String(p.quantite_stock ?? ""));
    setPage("produits");
  }

  async function supprimerProduit(id) {
  if (!window.confirm("Supprimer ce produit ?")) return;

  const { data, error } = await supabase
    .from("produits")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    setError(error.message);
    return;
  }

  if (!data || data.length === 0) {
    setError("Suppression impossible. Vérifie les autorisations de la table produits.");
    return;
  }

  setMessage("Produit supprimé avec succès.");
  await chargerDonnees();
}

  function viderClient() {
    setNomClient("");
    setTelephone("");
    setCourriel("");
    setAdresse("");
    setNotes("");
    setEditClient(null);
  }

  async function enregistrerClient(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const donnees = {
      user_id: user.id,
      nom_complet: nomClient.trim(),
      telephone: telephone.trim(),
      email: courriel.trim(),
      adresse: adresse.trim(),
      notes: notes.trim()
    };

    const result = editClient
      ? await supabase
          .from("clients")
          .update(donnees)
          .eq("id", editClient)
      : await supabase.from("clients").insert([donnees]);

    if (result.error) {
      setError("Client : " + result.error.message);
    } else {
      setMessage("Client enregistré avec succès.");
      viderClient();
      await chargerDonnees();
    }

    setBusy(false);
  }

  function modifierClient(c) {
    setEditClient(c.id);
    setNomClient(c.nom_complet || "");
    setTelephone(c.telephone || "");
    setCourriel(c.email || "");
    setAdresse(c.adresse || "");
    setNotes(c.notes || "");
    setPage("clients");
  }

  async function supprimerClient(id) {
    if (!window.confirm("Supprimer ce client ?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) setError(error.message);
    else {
      setMessage("Client supprimé.");
      await chargerDonnees();
    }
  }

  const totalStock = produits.reduce(
    (s, p) => s + Number(p.quantite_stock || 0),
    0
  );

  const valeurStock = produits.reduce(
    (s, p) => s + Number(p.prix || 0) * Number(p.quantite_stock || 0),
    0
  );

  if (loading) {
    return <div className="loading-screen">SELL PILOT AI · Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={authentifier}>
          <div className="logo">SP</div>
          <h1>SELL PILOT AI</h1>
          <p className="muted">La gestion intelligente de votre commerce.</p>

          <h2>{inscription ? "Créer un compte" : "Connexion"}</h2>

          <label>Adresse e-mail</label>
          <input
            type="email"
            required
            value={connexionEmail}
            onChange={e => setConnexionEmail(e.target.value)}
            placeholder="Votre adresse e-mail"
          />

          <label>Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
          />

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <button className="primary" disabled={busy}>
            {busy ? "Patientez..." : inscription ? "Créer mon compte" : "Se connecter"}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setInscription(!inscription);
              setError("");
              setMessage("");
            }}
          >
            {inscription ? "J'ai déjà un compte" : "Créer un nouveau compte"}
          </button>
        </form>
      </div>
    );
  }

  const menus = [
    ["dashboard", "Tableau de bord"],
    ["produits", "Produits"],
    ["clients", "Clients"],
    ["commandes", "Commandes"],
    ["ventes", "Ventes"],
    ["factures", "Factures"]
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SP</div>
          <div>
            <strong>SELL PILOT AI</strong>
            <small>Gestion intelligente</small>
          </div>
        </div>

        <nav className="side-nav">
          {menus.map(([id, label]) => (
            <button
              key={id}
              className={page === id ? "nav-item selected" : "nav-item"}
              onClick={() => {
                setPage(id);
                setError("");
                setMessage("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="account">
          <span>{user.email}</span>
          <button className="logout" onClick={deconnexion}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <span className="overline">ESPACE PROFESSIONNEL</span>
            <h1>{menus.find(m => m[0] === page)?.[1]}</h1>
          </div>
          <div className="avatar">SP</div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {page === "dashboard" && (
          <>
            <section className="hero">
              <span>BIENVENUE SUR SELL PILOT AI</span>
              <h2>Pilotez votre commerce avec confiance.</h2>
              <p>Vos produits et vos clients réunis dans un seul espace.</p>
            </section>

            <section className="stats">
              <div className="stat">
                <span>Produits</span>
                <strong>{produits.length}</strong>
              </div>
              <div className="stat">
                <span>Clients</span>
                <strong>{clients.length}</strong>
              </div>
              <div className="stat">
                <span>Unités en stock</span>
                <strong>{totalStock}</strong>
              </div>
              <div className="stat">
                <span>Valeur du stock</span>
                <strong>{valeurStock.toLocaleString("fr-FR")} F CFA</strong>
              </div>
            </section>

            <section className="panel">
              <h2>Accès rapide</h2>
              <div className="quick-actions">
                <button className="primary" onClick={() => setPage("produits")}>
                  + Ajouter un produit
                </button>
                <button className="secondary" onClick={() => setPage("clients")}>
                  + Ajouter un client
                </button>
              </div>
            </section>
          </>
        )}

        {page === "produits" && (
          <section className="panel">
            <h2>{editProduit ? "Modifier le produit" : "Ajouter un produit"}</h2>
            <form className="data-form" onSubmit={enregistrerProduit}>
              <label>Nom du produit</label>
              <input required value={nomProduit} onChange={e => setNomProduit(e.target.value)} placeholder="Nom du produit" />

              <label>Prix</label>
              <input required type="number" min="0" value={prixProduit} onChange={e => setPrixProduit(e.target.value)} placeholder="Prix" />

              <label>Quantité en stock</label>
              <input required type="number" min="0" value={stockProduit} onChange={e => setStockProduit(e.target.value)} placeholder="Quantité" />

              <button className="primary" disabled={busy}>
                {busy ? "Enregistrement..." : editProduit ? "Enregistrer les modifications" : "Ajouter le produit"}
              </button>

              {editProduit && <button type="button" className="secondary" onClick={viderProduit}>Annuler</button>}
            </form>

            <h2 className="section-title">Liste des produits</h2>
            {produits.map(p => (
              <article className="record" key={p.id}>
                <div>
                  <strong>{p.nom}</strong>
                  <p>{Number(p.prix).toLocaleString("fr-FR")} F CFA · Stock : {p.quantite_stock}</p>
                </div>
                <div className="record-actions">
                  <button onClick={() => modifierProduit(p)}>Modifier</button>
                  <button className="danger-button" onClick={() => supprimerProduit(p.id)}>Supprimer</button>
                </div>
              </article>
            ))}
            {produits.length === 0 && <p className="muted">Aucun produit enregistré.</p>}
          </section>
        )}

        {page === "clients" && (
          <section className="panel">
            <h2>{editClient ? "Modifier le client" : "Ajouter un client"}</h2>
            <form className="data-form" onSubmit={enregistrerClient}>
              <label>Nom complet</label>
              <input required value={nomClient} onChange={e => setNomClient(e.target.value)} placeholder="Nom du client" />

              <label>Téléphone</label>
              <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Numéro de téléphone" />

              <label>Courriel</label>
              <input type="email" value={courriel} onChange={e => setCourriel(e.target.value)} placeholder="Adresse e-mail" />

              <label>Adresse</label>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Adresse du client" />

              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informations supplémentaires" />

              <button className="primary" disabled={busy}>
                {busy ? "Enregistrement..." : editClient ? "Enregistrer les modifications" : "Enregistrer le client"}
              </button>

              {editClient && <button type="button" className="secondary" onClick={viderClient}>Annuler</button>}
            </form>

            <h2 className="section-title">Liste des clients</h2>
            {clients.map(c => (
              <article className="record" key={c.id}>
                <div>
                  <strong>{c.nom_complet}</strong>
                  <p>{c.telephone || "Pas de téléphone"}</p>
                  <p>{c.email || "Pas de courriel"}</p>
                  <p>{c.adresse || ""}</p>
                </div>
                <div className="record-actions">
                  <button onClick={() => modifierClient(c)}>Modifier</button>
                  <button className="danger-button" onClick={() => supprimerClient(c.id)}>Supprimer</button>
                </div>
              </article>
            ))}
            {clients.length === 0 && <p className="muted">Aucun client enregistré.</p>}
          </section>
        )}

        {["commandes", "ventes", "factures"].includes(page) && (
          <section className="panel">
            <h2>Fonctionnalité en préparation</h2>
            <p className="muted">Cette partie sera ajoutée prochainement.</p>
          </section>
        )}
      </main>
    </div>
  );
}
