import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import GameDetailPage from './pages/GameDetailPage';
import GameFormPage from './pages/GameFormPage';
import StatisticsPage from './pages/StatisticsPage';
import PriceTrackerPage from './pages/PriceTrackerPage';
import ToolsPage from './pages/ToolsPage';
import SettingsPage from './pages/SettingsPage';
import { gamesApi } from './services/api';
import { loadCurrencyPreference, saveCurrencyPreference, convertCurrency } from './services/currency';
import './App.css';

function App() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState(loadCurrencyPreference());
  const [stats, setStats] = useState({
    totalGames: 0,
    totalValue: 0,
    totalProfit: 0,
    soldGames: 0
  });

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  // Calculate stats whenever games change
  useEffect(() => {
    calculateStats();
  }, [games]);

  const loadGames = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await gamesApi.getAll();
      setGames(response.data);
    } catch (err) {
      setError('Failed to load games. Please check your backend connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalGames = games.length;
    const soldGames = games.filter(g => g.sold_value !== null).length;

    // Convert all market values to USD before summing
    const totalValue = games
      .filter(g => g.sold_value === null && g.market_value !== null)
      .reduce((sum, g) => {
        const valueInUSD = convertCurrency(g.market_value || 0, g.market_value_currency || 'USD', 'USD');
        return sum + (valueInUSD || 0);
      }, 0);

    // Convert sold and purchase values to USD before calculating profit
    const totalProfit = games
      .filter(g => g.sold_value !== null && g.purchase_value !== null)
      .reduce((sum, g) => {
        const soldInUSD = convertCurrency(g.sold_value || 0, g.sold_value_currency || 'USD', 'USD');
        const purchaseInUSD = convertCurrency(g.purchase_value || 0, g.purchase_value_currency || 'USD', 'USD');
        return sum + ((soldInUSD || 0) - (purchaseInUSD || 0));
      }, 0);

    setStats({ totalGames, totalValue, totalProfit, soldGames });
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;

    try {
      await gamesApi.delete(id);
      loadGames();
    } catch (err) {
      alert('Failed to delete game');
      console.error(err);
    }
  };

  const handleRefreshMarket = async (game) => {
    try {
      const response = await gamesApi.refreshMarketValue(game.id);
      alert(response.data.message || 'Market value refreshed successfully');
      loadGames();
    } catch (err) {
      alert('Failed to refresh market value');
      console.error(err);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    saveCurrencyPreference(newCurrency);
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <Router>
      <Layout stats={stats} currency={currency}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                games={games}
                currency={currency}
                onDelete={handleDeleteGame}
                onRefreshMarket={handleRefreshMarket}
                onGamesUpdate={loadGames}
              />
            }
          />
          <Route
            path="/game/:id"
            element={<GameDetailPage />}
          />
          <Route
            path="/add-game"
            element={
              <GameFormPage
                currency={currency}
                onSave={loadGames}
              />
            }
          />
          <Route
            path="/edit-game/:id"
            element={
              <GameFormPage
                currency={currency}
                onSave={loadGames}
              />
            }
          />
          <Route
            path="/statistics"
            element={
              <StatisticsPage
                games={games}
                currency={currency}
              />
            }
          />
          <Route
            path="/price-tracker"
            element={<PriceTrackerPage />}
          />
          <Route
            path="/tools"
            element={
              <ToolsPage
                onDataChange={loadGames}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                currentCurrency={currency}
                onCurrencyChange={handleCurrencyChange}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
