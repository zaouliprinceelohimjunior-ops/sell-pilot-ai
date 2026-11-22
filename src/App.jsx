import React, { useState } from "react";

function App() {
  const [produits, setProduits] = useState([]);
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [quantite, setQuantite] = useState("");

  function ajouterProduit(e) {
    e.preventDefault();

    if (!nom || !prix || !quantite) return;

    setProduits([
      ...produits,
      {
        id: Date.now(),
        nom,
        prix: Number(prix),
        quantite: Number(quantite),
      },
    ]);

    setNom("");
    setPrix("");
    setQuantite("");
  }

  return (
    <main className="dashboard">
      <header className="header">
        <h1>SELL PILOT AI</h1>
        <p>Votre commerce, piloté intelligemment.</p>
      </header>

      <section className="welcome">
        <h2>Gestion des produits</h2>
        <p>Ajoutez et consultez vos produits.</p>
      </section>

      <form className="card" onSubmit={ajouterProduit}>
        <h3>Ajouter un produit</h3>

        <input
          placeholder="Nom du produit"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />

        <input
          type="number"
          placeholder="Prix"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quantité en stock"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
        />

        <button type="submit">Ajouter le produit</button>
      </form>

      <section className="grid">
        {produits.map((produit) => (
          <article className="card" key={produit.id}>
            <h3>{produit.nom}</h3>
            <p>Prix : {produit.prix}</p>
            <p>Stock : {produit.quantite}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;