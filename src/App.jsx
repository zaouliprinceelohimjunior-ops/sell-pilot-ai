
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
  const [message, setMessage] = useState("");
  const [modificationId, setModificationId] = useState(null);
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
    setMessage("Chargement...");

    const resultat = inscription
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

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

    if (resultat.error) {
      setMessage(resultat.error.message);
    } else {
      setNom("");
      setPrix("");
      setStock("");
      setModificationId(null);
      setMessage(
        modificationId ? "Produit modifié !" : "Produit ajouté !"
      );
      await chargerProduits();
    }

    setChargement(false);
  }

  function modifierProduit(produit) {
    setModificationId(produit.id);
    setNom(produit.nom);
    setPrix(String(produit.prix));
    setStock(String(produit.quantite_stock));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setMessage("Produit supprimé !");
      await chargerProduits();
    }
  }

  function annulerModification() {
    setModificationId(null);
    setNom("");
    setPrix("");
    setStock("");
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

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">SP</div>
          <h1>SELL PILOT AI</h1>
          <p className="subtitle">
            Votre commerce, piloté intelligemment.
          </p>

          <h2>{inscription ? "Créer un compte" : "Bienvenue"}</h2>
          <p>Accédez à votre espace de gestion commerciale.</p>

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

            <button className="primary-btn" type="submit">
              {inscription ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <button
            className="text-btn"
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
    <main className="app-page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div>
            <h1>SELL PILOT AI</h1>
            <span>Gestion intelligente</span>
          </div>
        </div>

        <button className="logout-btn" onClick={deconnexion}>
          Déconnexion
        </button>
      </header>

      <section className="welcome">
        <span className="eyebrow">ESPACE DE GESTION</span>
        <h2>Bienvenue dans votre espace</h2>
        <p>Pilotez votre activité depuis un seul endroit.</p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Produits enregistrés</span>
          <strong>{produits.length}</strong>
          <small>Dans votre catalogue</small>
        </article>

        <article className="stat-card">
          <span>Quantité en stock</span>
          <strong>{totalStock}</strong>
          <small>Unités enregistrées</small>
        </article>

        <article className="stat-card">
          <span>Valeur du stock</span>
          <strong>{valeurStock.toLocaleString()}</strong>
          <small>Prix × quantités</small>
        </article>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CATALOGUE</span>
              <h2>
                {modificationId ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
            </div>
          </div>

          <form onSubmit={enregistrerProduit} className="product-form">
            <label>Nom du produit</label>
            <input
              placeholder="Exemple : Chaussures"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />

            <label>Prix</label>
            <input
              type="number"
              min="0"
              placeholder="Prix du produit"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              required
            />

            <label>Quantité en stock</label>
            <input
              type="number"
              min="0"
              placeholder="Quantité disponible"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={chargement}
            >
              {chargement
                ? "Enregistrement..."
                : modificationId
                  ? "Enregistrer les modifications"
                  : "Ajouter le produit"}
            </button>

            {modificationId && (
              <button
                className="secondary-btn"
                type="button"
                onClick={annulerModification}
              >
                Annuler
              </button>
            )}
          </form>

          {message && <p className="notice">{message}</p>}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">INVENTAIRE</span>
              <h2>Mes produits</h2>
            </div>
            <span className="count-badge">{produits.length}</span>
          </div>

          {produits.length === 0 ? (
            <div className="empty-state">
              <span>📦</span>
              <h3>Aucun produit</h3>
              <p>Ajoutez votre premier produit pour commencer.</p>
            </div>
          ) : (
            <div className="product-list">
              {produits.map((produit) => (
                <article className="product-card" key={produit.id}>
                  <div className="product-info">
                    <h3>{produit.nom}</h3>
                    <p>Prix : {Number(produit.prix).toLocaleString()}</p>
                    <p>Stock : {produit.quantite_stock}</p>
                  </div>

                  <div className="product-actions">
                    <button
                      className="edit-btn"
                      onClick={() => modifierProduit(produit)}
                    >
                      Modifier
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => supprimerProduit(produit.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer className="footer">
        SELL PILOT AI · Votre commerce, piloté intelligemment.
      </footer>
    </main>
  );
}
