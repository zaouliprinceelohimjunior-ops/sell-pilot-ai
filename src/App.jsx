
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
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [modificationId, setModificationId] = useState(null);

  const [message, setMessage] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) chargerProduits();
  }, [user]);

  async function chargerProduits() {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setProduits(data || []);
    }
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

  async function enregistrerProduit(e) {
    e.preventDefault();
    setChargement(true);
    setMessage("");

    const produit = {
      nom,
      prix: Number(prix),
      quantite_stock: Number(stock)
    };

    const resultat = modificationId
      ? await supabase
          .from("produits")
          .update(produit)
          .eq("id", modificationId)
      : await supabase.from("produits").insert(produit);

    setChargement(false);

    if (resultat.error) {
      setMessage(resultat.error.message);
      return;
    }

    setNom("");
    setPrix("");
    setStock("");
    setModificationId(null);
    setMessage(
      modificationId
        ? "Produit modifié avec succès !"
        : "Produit ajouté avec succès !"
    );

    chargerProduits();
  }

  function modifierProduit(produit) {
    setNom(produit.nom);
    setPrix(String(produit.prix));
    setStock(String(produit.quantite_stock));
    setModificationId(produit.id);
    document.getElementById("formulaire-produit")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  async function supprimerProduit(id) {
    if (!window.confirm("Veux-tu vraiment supprimer ce produit ?")) return;

    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Produit supprimé.");
      chargerProduits();
    }
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    setProduits([]);
  }

  const totalStock = produits.reduce(
    (total, produit) => total + Number(produit.quantite_stock || 0),
    0
  );

  const valeurStock = produits.reduce(
    (total, produit) =>
      total +
      Number(produit.prix || 0) *
        Number(produit.quantite_stock || 0),
    0
  );

  const formatPrix = (montant) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " F CFA";

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
          <p>Connectez-vous pour gérer votre activité.</p>

          <form onSubmit={connexion}>
            <label>Adresse e-mail</label>
            <input
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="Votre mot de passe"
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
            {inscription
              ? "J'ai déjà un compte"
              : "Créer un nouveau compte"}
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
          <a className="nav-link" href="#commandes">▣ Commandes</a>
          <a className="nav-link" href="#ventes">↗ Ventes</a>
          <a className="nav-link" href="#factures">▧ Factures</a>
        </nav>

        <div className="sidebar-bottom">
          <span>Connecté</span>
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
              <p>Suivez les informations de votre catalogue.</p>
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
              <small>Prix × quantités</small>
            </article>
          </div>
        </section>

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
            <h3>
              {modificationId ? "Modifier le produit" : "Ajouter un produit"}
            </h3>

            <div className="form-grid">
              <div className="field">
                <label>Nom du produit</label>
                <input
                  placeholder="Exemple : Chaussures"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Prix de vente</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Prix du produit"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Quantité en stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Quantité disponible"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={chargement}>
                {chargement
                  ? "Enregistrement..."
                  : modificationId
                    ? "Enregistrer les modifications"
                    : "+ Ajouter le produit"}
              </button>

              {modificationId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setModificationId(null);
                    setNom("");
                    setPrix("");
                    setStock("");
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>

          {message && <p className="notice">{message}</p>}

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
              <div className="empty-state">
                <span>▤</span>
                <h3>Aucun produit pour le moment</h3>
                <p>Ajoutez votre premier produit pour commencer.</p>
              </div>
            ) : (
              produits.map((produit) => (
                <article className="product-card" key={produit.id}>
                  <div className="product-icon">▤</div>
                  <div className="product-info">
                    <strong>{produit.nom}</strong>
                    <span>{formatPrix(Number(produit.prix))}</span>
                    <small>
                      Stock : {produit.quantite_stock} unité(s)
                    </small>
                  </div>
                  <div className="product-actions">
                    <button
                      className="edit-button"
                      onClick={() => modifierProduit(produit)}
                    >
                      Modifier
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => supprimerProduit(produit.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <footer className="app-footer">
          SELL PILOT AI · Gestion intelligente de votre commerce
        </footer>
      </main>
    </div>
  );
}
