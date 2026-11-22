import React from "react";

function App() {
  const sections = [
    { name: "Produits", icon: "📦", description: "Gérez votre catalogue" },
    { name: "Clients", icon: "👥", description: "Suivez vos clients" },
    { name: "Commandes", icon: "🛒", description: "Gérez vos commandes" },
    { name: "Ventes", icon: "💰", description: "Suivez vos ventes" },
    { name: "Factures", icon: "📄", description: "Gérez vos factures" },
  ];

  return (
    <main className="dashboard">
      <header className="header">
        <h1>SELL PILOT AI</h1>
        <p>Votre commerce, piloté intelligemment.</p>
      </header>

      <section className="welcome">
        <h2>Tableau de bord</h2>
        <p>Bienvenue dans votre espace de gestion commerciale.</p>
      </section>

      <section className="grid">
        {sections.map((item) => (
          <article className="card" key={item.name}>
            <span className="icon">{item.icon}</span>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <button type="button">Accéder</button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;