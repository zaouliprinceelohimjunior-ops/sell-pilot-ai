import React from 'react'

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#10172a',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '24px'
    }}>
      <h1>SELL PILOT AI</h1>
      <p>Votre commerce, piloté intelligemment.</p>

      <h2>Tableau de bord</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        <div><h3>Clients</h3><p>Gérez vos clients</p></div>
        <div><h3>Produits</h3><p>Gérez votre stock</p></div>
        <div><h3>Commandes</h3><p>Suivez vos commandes</p></div>
        <div><h3>Ventes</h3><p>Suivez vos ventes</p></div>
        <div><h3>Factures</h3><p>Gérez vos factures</p></div>
      </div>
    </div>
  )
}
