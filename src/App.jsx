
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const monnaie = (n) =>
  Number(n || 0).toLocaleString("fr-FR") + " F CFA";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState("dashboard");

  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [articles, setArticles] = useState([]);

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

  const [clientCommande, setClientCommande] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [notesCommande, setNotesCommande] = useState("");
  const [lignes, setLignes] = useState([
    { produit_id: "", quantite: 1 }
  ]);

  useEffect(() => {
    let actif = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!actif) return;
      if (error) setError(error.message);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

    return () => {
      actif = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) chargerDonnees();
    else {
      setProduits([]);
      setClients([]);
      setCommandes([]);
      setArticles([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && page === "commandes") chargerCommandes();
  }, [user, page]);

  async function chargerDonnees() {
    setError("");

    const p = await supabase
      .from("produits")
      .select("*")
      .order("created_at", { ascending: false });

    if (p.error) setError("Produits : " + p.error.message);
    else setProduits(p.data || []);

    const c = await supabase
      .from("clients")
      .select("*")
      .order("nom_complet");

    if (c.error) setError("Clients : " + c.error.message);
    else setClients(c.data || []);
  }

  async function chargerCommandes() {
    const result = await supabase
      .from("commandes")
      .select("*")
      .order("created_at", { ascending: false });

    if (result.error) {
      setError("Commandes : " + result.error.message);
      return;
    }

    setCommandes(result.data || []);

    const ids = (result.data || []).map(c => c.id);

    if (ids.length === 0) {
      setArticles([]);
      return;
    }

    const detail = await supabase
      .from("commande_articles")
      .select("*")
      .in("commande_id", ids);

    if (detail.error) {
      setError("Articles : " + detail.error.message);
      return;
    }

    setArticles(detail.data || []);
  }

  async function authentifier(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = inscription
        ? await supabase.auth.signUp({
            email: connexionEmail.trim(),
            password
          })
        : await supabase.auth.signInWithPassword({
            email: connexionEmail.trim(),
            password
          });

      if (result.error) {
        setError(result.error.message);
      } else if (inscription) {
        setMessage(
          "Inscription envoyée. Vérifie ton e-mail si demandé."
        );
      } else {
        setMessage("Connexion réussie.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deconnexion() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setBusy(false);
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

    try {
      const donnees = {
        user_id: user.id,
        nom: nomProduit.trim(),
        prix: Number(prixProduit),
        quantite_stock: Number(stockProduit)
      };

      const result = editProduit
        ? await supabase
            .from("produits")
            .update(donnees)
            .eq("id", editProduit)
        : await supabase
            .from("produits")
            .insert([donnees]);

      if (result.error) {
        setError("Produit : " + result.error.message);
      } else {
        setMessage("Produit enregistré avec succès.");
        viderProduit();
        await chargerDonnees();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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

    setError("");
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
      setError("Suppression impossible. Vérifie les autorisations.");
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

    try {
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
        : await supabase
            .from("clients")
            .insert([donnees]);

      if (result.error) {
        setError("Client : " + result.error.message);
      } else {
        setMessage("Client enregistré avec succès.");
        viderClient();
        await chargerDonnees();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Client supprimé.");
      await chargerDonnees();
    }
  }

  function ajouterLigne() {
    setLignes([
      ...lignes,
      { produit_id: "", quantite: 1 }
    ]);
  }

  function modifierLigne(index, champ, valeur) {
    setLignes(lignes.map((ligne, i) =>
      i === index
        ? { ...ligne, [champ]: valeur }
        : ligne
    ));
  }

  function supprimerLigne(index) {
    if (lignes.length === 1) {
      setLignes([{ produit_id: "", quantite: 1 }]);
    } else {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  }

  const totalCommande = lignes.reduce((total, ligne) => {
    const p = produits.find(x => x.id === ligne.produit_id);
    return total + (
      p
        ? Number(p.prix) * Number(ligne.quantite || 0)
        : 0
    );
  }, 0);

  async function enregistrerCommande(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (!clientCommande) {
        setError("Choisis un client.");
        return;
      }

      const articlesCommande = lignes.map(l => ({
        produit_id: l.produit_id,
        quantite: Number(l.quantite)
      }));

      if (
        articlesCommande.some(
          a => !a.produit_id || !Number.isInteger(a.quantite) || a.quantite <= 0
        )
      ) {
        setError("Vérifie les produits et les quantités.");
        return;
      }

      const ids = articlesCommande.map(a => a.produit_id);

      if (new Set(ids).size !== ids.length) {
        setError(
          "Un même produit ne doit pas être ajouté deux fois. Modifie sa quantité."
        );
        return;
      }

      const { error } = await supabase.rpc("creer_commande", {
        p_client_id: clientCommande,
        p_articles: articlesCommande,
        p_mode_paiement: modePaiement || null,
        p_notes: notesCommande.trim() || null
      });

      if (error) {
        setError("Commande : " + error.message);
      } else {
        setMessage(
          "Commande enregistrée avec succès. Le stock a été mis à jour."
        );
        setClientCommande("");
        setModePaiement("");
        setNotesCommande("");
        setLignes([{ produit_id: "", quantite: 1 }]);
        await chargerDonnees();
        await chargerCommandes();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function nomDuProduit(id) {
    return produits.find(p => p.id === id)?.nom || "Produit";
  }

  function nomDuClient(id) {
    return clients.find(c => c.id === id)?.nom_complet || "Client";
  }

  const totalStock = produits.reduce(
    (s, p) => s + Number(p.quantite_stock || 0),
    0
  );

  const valeurStock = produits.reduce(
    (s, p) =>
      s + Number(p.prix || 0) * Number(p.quantite_stock || 0),
    0
  );

  const menus = [
    ["dashboard", "Tableau de bord"],
    ["produits", "Produits"],
    ["clients", "Clients"],
    ["commandes", "Commandes"],
    ["ventes", "Ventes"],
    ["factures", "Factures"]
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        SELL PILOT AI · Chargement...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={authentifier}>
          <div className="logo">SP</div>
          <h1>SELL PILOT AI</h1>
          <p className="muted">
            La gestion intelligente de votre commerce.
          </p>

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
            {busy
              ? "Patientez..."
              : inscription
                ? "Créer mon compte"
                : "Se connecter"}
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
            {inscription
              ? "J'ai déjà un compte"
              : "Créer un nouveau compte"}
          </button>
        </form>
      </div>
    );
  }

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
              className={
                page === id ? "nav-item selected" : "nav-item"
              }
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
          <button
            className="logout"
            onClick={deconnexion}
            disabled={busy}
          >
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
              <p>
                Vos produits et vos clients réunis dans un seul espace.
              </p>
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
                <strong>{monnaie(valeurStock)}</strong>
              </div>
            </section>

            <section className="panel">
              <h2>Accès rapide</h2>
              <div className="quick-actions">
                <button
                  className="primary"
                  onClick={() => setPage("produits")}
                >
                  + Ajouter un produit
                </button>
                <button
                  className="secondary"
                  onClick={() => setPage("clients")}
                >
                  + Ajouter un client
                </button>
                <button
                  className="secondary"
                  onClick={() => setPage("commandes")}
                >
                  + Créer une commande
                </button>
              </div>
            </section>
          </>
        )}

        {page === "produits" && (
          <section className="panel">
            <h2>
              {editProduit ? "Modifier le produit" : "Ajouter un produit"}
            </h2>

            <form className="data-form" onSubmit={enregistrerProduit}>
              <label>Nom du produit</label>
              <input
                required
                value={nomProduit}
                onChange={e => setNomProduit(e.target.value)}
                placeholder="Nom du produit"
              />

              <label>Prix</label>
              <input
                required
                type="number"
                min="0"
                value={prixProduit}
                onChange={e => setPrixProduit(e.target.value)}
                placeholder="Prix"
              />

              <label>Quantité en stock</label>
              <input
                required
                type="number"
                min="0"
                value={stockProduit}
                onChange={e => setStockProduit(e.target.value)}
                placeholder="Quantité"
              />

              <button className="primary" disabled={busy}>
                {busy
                  ? "Enregistrement..."
                  : editProduit
                    ? "Enregistrer les modifications"
                    : "Ajouter le produit"}
              </button>

              {editProduit && (
                <button
                  type="button"
                  className="secondary"
                  onClick={viderProduit}
                >
                  Annuler
                </button>
              )}
            </form>

            <h2 className="section-title">Liste des produits</h2>

            {produits.map(p => (
              <article className="record" key={p.id}>
                <div>
                  <strong>{p.nom}</strong>
                  <p>
                    {monnaie(p.prix)} · Stock : {p.quantite_stock}
                  </p>
                </div>

                <div className="record-actions">
                  <button onClick={() => modifierProduit(p)}>
                    Modifier
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => supprimerProduit(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}

            {produits.length === 0 && (
              <p className="muted">Aucun produit enregistré.</p>
            )}
          </section>
        )}

        {page === "clients" && (
          <section className="panel">
            <h2>
              {editClient ? "Modifier le client" : "Ajouter un client"}
            </h2>

            <form className="data-form" onSubmit={enregistrerClient}>
              <label>Nom complet</label>
              <input
                required
                value={nomClient}
                onChange={e => setNomClient(e.target.value)}
                placeholder="Nom du client"
              />

              <label>Téléphone</label>
              <input
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="Numéro de téléphone"
              />

              <label>Courriel</label>
              <input
                type="email"
                value={courriel}
                onChange={e => setCourriel(e.target.value)}
                placeholder="Adresse e-mail"
              />

              <label>Adresse</label>
              <input
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                placeholder="Adresse du client"
              />

              <label>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Informations supplémentaires"
              />

              <button className="primary" disabled={busy}>
                
                {busy
                  ? "Enregistrement..."
                  : editClient
                    ? "Enregistrer les modifications"
                    : "Ajouter le client"}
              </button>

              {editClient && (
                <button
                  type="button"
                  className="secondary"
                  onClick={viderClient}
                >
                  Annuler
                </button>
              )}
            </form>

            <h2 className="section-title">Liste des clients</h2>

            {clients.map(c => (
              <article className="record" key={c.id}>
                <div>
                  <strong>{c.nom_complet}</strong>
                  <p>{c.telephone || "Aucun téléphone"}</p>
                  <p>{c.email || "Aucun courriel"}</p>
                </div>

                <div className="record-actions">
                  <button onClick={() => modifierClient(c)}>
                    Modifier
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => supprimerClient(c.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}

            {clients.length === 0 && (
              <p className="muted">Aucun client enregistré.</p>
            )}
          </section>
        )}

        {page === "commandes" && (
          <>
            <section className="panel">
              <h2>Créer une commande</h2>

              <form className="data-form" onSubmit={enregistrerCommande}>
                <label>Choisir un client</label>
                <select
                  required
                  value={clientCommande}
                  onChange={e => setClientCommande(e.target.value)}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nom_complet}
                    </option>
                  ))}
                </select>

                <h3>Produits de la commande</h3>

                {lignes.map((ligne, index) => (
                  <div className="order-line" key={index}>
                    <label>Produit</label>
                    <select
                      required
                      value={ligne.produit_id}
                      onChange={e =>
                        modifierLigne(
                          index,
                          "produit_id",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Choisir un produit</option>
                      {produits.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} — {monnaie(p.prix)} — Stock : {p.quantite_stock}
                        </option>
                      ))}
                    </select>

                    <label>Quantité</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={ligne.quantite}
                      onChange={e =>
                        modifierLigne(
                          index,
                          "quantite",
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => supprimerLigne(index)}
                    >
                      Retirer ce produit
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="secondary"
                  onClick={ajouterLigne}
                >
                  + Ajouter un autre produit
                </button>

                <div className="order-total">
                  <span>Total de la commande</span>
                  <strong>{monnaie(totalCommande)}</strong>
                </div>

                <label>Mode de paiement</label>
                <select
                  value={modePaiement}
                  onChange={e => setModePaiement(e.target.value)}
                >
                  <option value="">Choisir un mode de paiement</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Carte bancaire">Carte bancaire</option>
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Autre">Autre</option>
                </select>

                <label>Notes sur la commande</label>
                <textarea
                  value={notesCommande}
                  onChange={e => setNotesCommande(e.target.value)}
                  placeholder="Informations supplémentaires..."
                />

                <button
                  className="primary"
                  disabled={busy || produits.length === 0 || clients.length === 0}
                >
                  {busy ? "Enregistrement..." : "Enregistrer la commande"}
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>Historique des commandes</h2>

              {commandes.map(c => {
                const articlesCommande = articles.filter(
                  a => a.commande_id === c.id
                );

                return (
                  <article className="record" key={c.id}>
                    <div>
                      <strong>{nomDuClient(c.client_id)}</strong>
                      <p>
                        Date : {c.date_commande
                          ? new Date(c.date_commande).toLocaleDateString("fr-FR")
                          : "Non renseignée"}
                      </p>
                      <p>
                        Statut : {c.statut || "Enregistrée"}
                      </p>
                      <p>
                        Total : {monnaie(c.montant_total)}
                      </p>

                      <div className="order-details">
                        <strong>Articles :</strong>
                        {articlesCommande.map(a => (
                          <p key={a.id}>
                            {nomDuProduit(a.produit_id)} × {a.quantite}
                            {" — "}
                            {monnaie(
                              Number(a.prix_unitaire) * Number(a.quantite)
                            )}
                          </p>
                        ))}
                      </div>

                      <p>
                        Paiement : {c.mode_paiement || "Non précisé"}
                      </p>
                    </div>
                  </article>
                );
              })}

              {commandes.length === 0 && (
                <p className="muted">Aucune commande enregistrée.</p>
              )}
            </section>
          </>
        )}

        {page === "ventes" && (
          <section className="panel">
            <h2>Gestion des ventes</h2>
            <p className="muted">
              Cette section permettra de suivre les ventes réalisées,
              les montants encaissés et les performances commerciales.
            </p>
            <p>
              Les commandes enregistrées sont disponibles dans la section
              Commandes.
            </p>
          </section>
        )}

        {page === "factures" && (
          <section className="panel">
            <h2>Gestion des factures</h2>
            <p className="muted">
              Cette section accueillera la création et le suivi des factures
              de vos clients.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
