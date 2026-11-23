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
      setProduits(data);
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
      setMessage("Inscription envoyée. Vérifie ton e-mail si demandé.");
    } else {
      setMessage("Connexion réussie !");
    }
  }

  async function ajouterProduit(e) {
    e.preventDefault();

    const { error } = await supabase.from("produits").insert({
      nom,
      prix: Number(prix),
      quantite_stock: Number(stock)
    });

    if (error) {
      setMessage(error.message);
    } else {
      setNom("");
      setPrix("");
      setStock("");
      setMessage("Produit ajouté !");
      chargerProduits();
    }
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    setProduits([]);
  }

  if (!user) {
    return (
      <main className="container">
        <h1>SELL PILOT AI</h1>
        <p>Votre commerce, piloté intelligemment.</p>
        <h2>{inscription ? "Créer un compte" : "Connexion"}</h2>

        <form onSubmit={connexion}>
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">
            {inscription ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <button onClick={() => setInscription(!inscription)}>
          {inscription ? "J'ai déjà un compte" : "Créer un compte"}
        </button>
        <p>{message}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>SELL PILOT AI</h1>
      <p>Votre commerce, piloté intelligemment.</p>
      <button onClick={deconnexion}>Déconnexion</button>

      <h2>Ajouter un produit</h2>
      <form onSubmit={ajouterProduit}>
        <input
          placeholder="Nom du produit"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Prix"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Quantité en stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />
        <button type="submit">Ajouter le produit</button>
      </form>

      <p>{message}</p>
      <h2>Mes produits</h2>

      {produits.map((produit) => (
        <div className="card" key={produit.id}>
          <strong>{produit.nom}</strong>
          <p>Prix : {produit.prix}</p>
          <p>Stock : {produit.quantite_stock}</p>
        </div>
      ))}
    </main>
  );
}