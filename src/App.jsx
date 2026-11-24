
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
  const [chargementProduits, setChargementProduits] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      chargerProduits();
    } else {
      setProduits([]);
    }
  }, [user]);

  async function chargerProduits() {
    setChargementProduits(true);

    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });

    setChargementProduits(false);

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

    if (!nom.trim()) {
      setMessage("Veuillez saisir le nom du produit.");
      return;
    }

    if (
      prix === "" ||
      stock === "" ||
      !Number.isFinite(Number(prix)) ||
      !Number.isFinite(Number(stock)) ||
      Number(prix) < 0 ||
      Number(stock) < 0
    ) {
      setMessage("Vérifiez le prix et la quantité en stock.");
      return;
    }

    const enModification = modificationId !== null;

    const produit = {
      nom: nom.trim(),
      prix: Number(prix),
      quantite_stock: Number(stock)
    };

    setChargement(true);
    setMessage("");

    const resultat = enModification
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

    reinitialiserFormulaire();

    setMessage(
      enModification
        ? "Produit modifié avec succès !"
        : "Produit ajouté avec succès !"
    );

    await chargerProduits();
  }

  function modifierProduit(produit) {
    setNom(produit.nom);
    setPrix(String(produit.prix));
    setStock(String(produit.quantite_stock));
    setModificationId(produit.id);

    document.getElementById("formulaire-produit")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function reinitialiserFormulaire() {
    setNom("");
    setPrix("");
    setStock("");
    setModificationId(null);
  }

  async function supprimerProduit(id) {
    const confirmation = window.confirm(
      "Veux-tu vraiment supprimer ce produit ?"
    );

    if (!confirmation) return;

    setMessage("");

    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Produit supprimé avec succès.");

      if (modificationId === id) {
        reinitialiserFormulaire();
      }

      await chargerProduits();
    }
  }

  async function deconnexion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
    } else {
      setProduits([]);
      reinitialiserFormulaire();
      setMessage("");
    }
  }

  const totalStock = produits.reduce(
    (total, produit) =>
      total + Number(produit.quantite_stock || 0),
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

          <p>
            {inscription
              ? "Créez votre espace professionnel."
              : "Connectez-vous pour gérer votre activité."}
          </p>

          <form onSubmit={connexion}>
            <label htmlFor="email">Adresse e-mail</label>

            <input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Mot de passe</label>

            <input
              id="password"
              type="password"
              placeholder="Votre mot de passe"
              autoComplete={
                inscription ? "new-password" : "current-password"
              }
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
            type="button"
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
          <a className="nav-link active" href="#dashboard">
            <span>▦</span> Tableau de bord
          </a>

          <a className="nav-link" href="#produits">
            <span>▤</span> Produits
          </a>

          <span className="nav-link disabled" aria-disabled="true">
            <span>♙</span> Clients <small>Bientôt</small>
          </span>

          <span className="nav-link disabled" aria-disabled="true">
            <span>▣</span> Commandes <small>Bientôt</small>
          </span>

          <span className="nav-link disabled" aria-disabled="true">
            <span>↗</span> Ventes <small>Bientôt</small>
          </span>

          <span className="nav-link disabled" aria-disabled="true">
            <span>▧</span> Factures <small>Bientôt</small>
          </span>
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
              <small>Prix multiplié par quantités</small>
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
              {modificationId
                ? "Modifier le produit"
                : "Ajouter un produit"}
            </h3>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="nom-produit">Nom du produit</label>
                <input
                  id="nom-produit"
                  placeholder="Exemple : Chaussures"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="prix-produit">Prix de vente</label>
                <input
                  id="prix-produit"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Prix du produit"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="stock-produit">Quantité en stock</label>
                <input
                  id="stock-produit"
                  type="number"
                  min="0"
                  step="1"
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
                  onClick={reinitialiserFormulaire}
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

            <button
              className="refresh-button"
              onClick={chargerProduits}
              disabled={chargementProduits}
            >
              {chargementProduits ? "Actualisation..." : "Actualiser"}
            </button>
          </div>

          <div className="product-list">
            {chargementProduits && produits.length === 0 ? (
              <div className="empty-state">
                Chargement de votre inventaire...
              </div>
            ) : produits.length === 0 ? (
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

                    <span className="product-price">
                      {formatPrix(Number(produit.prix))}
                    </span>

                    <small className="product-stock">
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
