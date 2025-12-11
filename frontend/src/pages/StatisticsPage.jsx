import React, { useState, useEffect } from 'react';
import { convertCurrency, formatCurrency } from '../services/currency';
import '../components/Statistics.css';
import './StatisticsPage.css';

function StatisticsPage({ games, currency }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    calculateAllStats();
  }, [games, currency]);

  const calculateAllStats = () => {
    // Convert all values to USD first for accurate calculations
    const gamesWithUSD = games.map(g => ({
      ...g,
      purchaseUSD: convertCurrency(g.purchase_value || 0, g.purchase_value_currency || 'USD', 'USD'),
      marketUSD: convertCurrency(g.market_value || 0, g.market_value_currency || 'USD', 'USD'),
      soldUSD: convertCurrency(g.sold_value || 0, g.sold_value_currency || 'USD', 'USD')
    }));

    const soldGames = gamesWithUSD.filter(g => g.sold_value !== null);
    const availableGames = gamesWithUSD.filter(g => g.sold_value === null);

    // Basic counts
    const totalGames = games.length;
    const soldCount = soldGames.length;
    const availableCount = availableGames.length;
    const postedCount = availableGames.filter(g => g.posted_online === 1).length;
    const notPostedCount = availableGames.filter(g => g.posted_online === 0 || g.posted_online === null).length;

    // Financial metrics
    const totalValue = availableGames.reduce((sum, g) => sum + (g.marketUSD || 0), 0);
    const totalProfit = soldGames.reduce((sum, g) => sum + ((g.soldUSD || 0) - (g.purchaseUSD || 0)), 0);
    const totalPurchaseValue = gamesWithUSD.reduce((sum, g) => sum + (g.purchaseUSD || 0), 0);
    const totalSoldValue = soldGames.reduce((sum, g) => sum + (g.soldUSD || 0), 0);

    // Averages
    const avgPurchasePrice = totalGames > 0 ? totalPurchaseValue / totalGames : 0;
    const avgMarketValue = availableCount > 0 ? totalValue / availableCount : 0;
    const avgProfitPerSale = soldCount > 0 ? totalProfit / soldCount : 0;

    // ROI
    const totalSoldPurchaseValue = soldGames.reduce((sum, g) => sum + (g.purchaseUSD || 0), 0);
    const roi = totalSoldPurchaseValue > 0 ? ((totalProfit / totalSoldPurchaseValue) * 100) : 0;

    // Platform breakdown
    const platformStats = {};
    games.forEach(g => {
      if (!platformStats[g.platform]) {
        platformStats[g.platform] = { count: 0, value: 0 };
      }
      platformStats[g.platform].count++;
      if (g.sold_value === null) {
        const valueUSD = convertCurrency(g.market_value || 0, g.market_value_currency || 'USD', 'USD');
        platformStats[g.platform].value += valueUSD || 0;
      }
    });

    // Condition breakdown
    const conditionStats = {};
    games.forEach(g => {
      const condition = g.condition || 'Unknown';
      conditionStats[condition] = (conditionStats[condition] || 0) + 1;
    });

    // Acquisition source analytics
    const acquisitionSourceStats = {};
    gamesWithUSD.forEach(g => {
      const source = g.acquisition_source || 'Unknown';
      if (!acquisitionSourceStats[source]) {
        acquisitionSourceStats[source] = {
          count: 0,
          totalPurchase: 0,
          totalSold: 0,
          totalProfit: 0,
          games: []
        };
      }
      acquisitionSourceStats[source].count++;
      acquisitionSourceStats[source].totalPurchase += g.purchaseUSD || 0;
      acquisitionSourceStats[source].games.push(g);

      if (g.sold_value !== null) {
        acquisitionSourceStats[source].totalSold += g.soldUSD || 0;
        acquisitionSourceStats[source].totalProfit += (g.soldUSD || 0) - (g.purchaseUSD || 0);
      }
    });

    // Calculate average profit per source
    Object.keys(acquisitionSourceStats).forEach(source => {
      const data = acquisitionSourceStats[source];
      const soldCount = data.games.filter(g => g.sold_value !== null).length;
      data.avgProfit = soldCount > 0 ? data.totalProfit / soldCount : 0;
      data.avgPurchase = data.count > 0 ? data.totalPurchase / data.count : 0;
      data.soldCount = soldCount;
    });

    // Most valuable game
    const mostValuableGame = availableGames.reduce((max, g) =>
      (g.marketUSD || 0) > (max?.marketUSD || 0) ? g : max, null);

    // Best profit sale
    const bestProfitSale = soldGames.reduce((max, g) => {
      const profit = (g.soldUSD || 0) - (g.purchaseUSD || 0);
      const maxProfit = max ? ((max.soldUSD || 0) - (max.purchaseUSD || 0)) : 0;
      return profit > maxProfit ? g : max;
    }, null);

    // Top 5 most valuable games
    const top5Valuable = [...availableGames]
      .sort((a, b) => (b.marketUSD || 0) - (a.marketUSD || 0))
      .slice(0, 5);

    // Price appreciation
    const priceAppreciation = availableGames
      .map(g => ({
        game: g,
        appreciation: (g.marketUSD || 0) - (g.purchaseUSD || 0),
        appreciationPercent: g.purchaseUSD > 0 ? (((g.marketUSD || 0) - (g.purchaseUSD || 0)) / g.purchaseUSD * 100) : 0
      }))
      .filter(a => a.appreciation > 0)
      .sort((a, b) => b.appreciation - a.appreciation)
      .slice(0, 5);

    // Break-even analysis
    const breakEvenGames = availableGames.filter(g =>
      (g.marketUSD || 0) < (g.purchaseUSD || 0)
    ).length;

    // Average days to sell
    const soldGamesWithDates = soldGames.filter(g => g.purchase_date && g.sale_date);
    const avgDaysToSell = soldGamesWithDates.length > 0
      ? soldGamesWithDates.reduce((sum, g) => {
          const purchaseDate = new Date(g.purchase_date);
          const saleDate = new Date(g.sale_date);
          const days = Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / soldGamesWithDates.length
      : 0;

    // Average time in collection
    const avgTimeInCollection = availableGames.filter(g => g.purchase_date).length > 0
      ? availableGames.filter(g => g.purchase_date).reduce((sum, g) => {
          const purchaseDate = new Date(g.purchase_date);
          const today = new Date();
          const days = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / availableGames.filter(g => g.purchase_date).length
      : 0;

    // Yearly statistics
    const yearlyStats = calculateYearlyStats(gamesWithUSD);

    // Monthly trends
    const monthlyTrends = calculateMonthlyTrends(gamesWithUSD);

    // Calendar data
    const calendarData = prepareCalendarData(games);

    setStats({
      totalGames,
      soldCount,
      availableCount,
      postedCount,
      notPostedCount,
      totalValue,
      totalProfit,
      totalPurchaseValue,
      totalSoldValue,
      avgPurchasePrice,
      avgMarketValue,
      avgProfitPerSale,
      roi,
      platformStats,
      conditionStats,
      acquisitionSourceStats,
      mostValuableGame,
      bestProfitSale,
      top5Valuable,
      priceAppreciation,
      breakEvenGames,
      avgDaysToSell,
      avgTimeInCollection,
      yearlyStats,
      monthlyTrends,
      calendarData
    });
  };

  const calculateYearlyStats = (gamesWithUSD) => {
    const yearlyData = {};

    gamesWithUSD.forEach(g => {
      // Track purchases by year
      if (g.purchase_date) {
        const year = new Date(g.purchase_date).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = { expenses: 0, revenue: 0, profit: 0, purchased: 0, sold: 0 };
        }
        yearlyData[year].expenses += g.purchaseUSD || 0;
        yearlyData[year].purchased++;
      }

      // Track sales by year
      if (g.sale_date) {
        const year = new Date(g.sale_date).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = { expenses: 0, revenue: 0, profit: 0, purchased: 0, sold: 0 };
        }
        yearlyData[year].revenue += g.soldUSD || 0;
        yearlyData[year].sold++;
        yearlyData[year].profit += (g.soldUSD || 0) - (g.purchaseUSD || 0);
      }
    });

    return yearlyData;
  };

  const calculateMonthlyTrends = (gamesWithUSD) => {
    const monthlyData = {};

    gamesWithUSD.forEach(g => {
      // Track purchases by month
      if (g.purchase_date) {
        const date = new Date(g.purchase_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { purchases: 0, sales: 0, purchaseValue: 0, salesValue: 0 };
        }
        monthlyData[monthKey].purchases++;
        monthlyData[monthKey].purchaseValue += g.purchaseUSD || 0;
      }

      // Track sales by month
      if (g.sale_date) {
        const date = new Date(g.sale_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { purchases: 0, sales: 0, purchaseValue: 0, salesValue: 0 };
        }
        monthlyData[monthKey].sales++;
        monthlyData[monthKey].salesValue += g.soldUSD || 0;
      }
    });

    return monthlyData;
  };

  const prepareCalendarData = (games) => {
    const calendarEvents = [];

    games.forEach(g => {
      if (g.purchase_date) {
        calendarEvents.push({
          date: g.purchase_date,
          type: 'purchase',
          game: g
        });
      }
      if (g.sale_date) {
        calendarEvents.push({
          date: g.sale_date,
          type: 'sale',
          game: g
        });
      }
    });

    return calendarEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const renderYearlyFinancials = () => {
    if (!stats.yearlyStats) return null;

    const years = Object.keys(stats.yearlyStats).sort((a, b) => b - a);

    return (
      <div className="stats-section">
        <h2>📅 Yearly Financials</h2>
        <div className="yearly-financials">
          {years.map(year => {
            const data = stats.yearlyStats[year];
            const netResult = data.revenue - data.expenses;
            const isProfit = netResult >= 0;

            return (
              <div key={year} className="year-card">
                <h3>{year}</h3>
                <div className="year-stats">
                  <div className="year-stat">
                    <span className="label">Expenses:</span>
                    <span className="value expense">{formatCurrency(convertCurrency(data.expenses, 'USD', currency), currency)}</span>
                  </div>
                  <div className="year-stat">
                    <span className="label">Revenue:</span>
                    <span className="value revenue">{formatCurrency(convertCurrency(data.revenue, 'USD', currency), currency)}</span>
                  </div>
                  <div className="year-stat">
                    <span className="label">Net {isProfit ? 'Profit' : 'Loss'}:</span>
                    <span className={`value ${isProfit ? 'profit' : 'loss'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(convertCurrency(netResult, 'USD', currency), currency)}
                    </span>
                  </div>
                  <div className="year-stat">
                    <span className="label">Purchased:</span>
                    <span className="value">{data.purchased} games</span>
                  </div>
                  <div className="year-stat">
                    <span className="label">Sold:</span>
                    <span className="value">{data.sold} games</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    if (!stats.calendarData || stats.calendarData.length === 0) return null;

    const recentEvents = stats.calendarData.slice(0, 20);

    return (
      <div className="stats-section">
        <h2>📆 Recent Activity Calendar</h2>
        <div className="calendar-events">
          {recentEvents.map((event, idx) => (
            <div key={idx} className={`calendar-event ${event.type}`}>
              <div className="event-date">{new Date(event.date).toLocaleDateString()}</div>
              <div className="event-type">{event.type === 'purchase' ? '🛒 Purchased' : '💰 Sold'}</div>
              <div className="event-game">{event.game.name}</div>
              <div className="event-platform">{event.game.platform}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlyTrends = () => {
    if (!stats.monthlyTrends) return null;

    const months = Object.keys(stats.monthlyTrends).sort().reverse().slice(0, 12);

    return (
      <div className="stats-section">
        <h2>📈 Monthly Trends (Last 12 Months)</h2>
        <div className="monthly-trends">
          {months.map(month => {
            const data = stats.monthlyTrends[month];
            return (
              <div key={month} className="month-bar">
                <div className="month-label">{month}</div>
                <div className="month-data">
                  <div className="trend-row">
                    <span className="trend-label">Purchases:</span>
                    <span className="trend-value">{data.purchases} ({formatCurrency(convertCurrency(data.purchaseValue, 'USD', currency), currency)})</span>
                  </div>
                  <div className="trend-row">
                    <span className="trend-label">Sales:</span>
                    <span className="trend-value">{data.sales} ({formatCurrency(convertCurrency(data.salesValue, 'USD', currency), currency)})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!stats.totalGames && stats.totalGames !== 0) {
    return <div className="stats-loading">Calculating statistics...</div>;
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>📊 Collection Statistics</h1>
      </div>

      <div className="statistics-body">
        {/* Overview Cards */}
        <div className="stats-section">
          <h2>🎮 Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Total Games</div>
              <div className="stat-value">{stats.totalGames}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Collection Value</div>
              <div className="stat-value">{formatCurrency(convertCurrency(stats.totalValue, 'USD', currency), currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Total Profit</div>
              <div className="stat-value profit">{stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(stats.totalProfit, 'USD', currency), currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Games Sold</div>
              <div className="stat-value">{stats.soldCount}</div>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="stats-section">
          <h2>💰 Financial Metrics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Avg Purchase Price</div>
              <div className="stat-value small">{formatCurrency(convertCurrency(stats.avgPurchasePrice, 'USD', currency), currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg Market Value</div>
              <div className="stat-value small">{formatCurrency(convertCurrency(stats.avgMarketValue, 'USD', currency), currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg Profit/Sale</div>
              <div className="stat-value small">{formatCurrency(convertCurrency(stats.avgProfitPerSale, 'USD', currency), currency)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">ROI</div>
              <div className="stat-value small">{stats.roi.toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Break-even Games</div>
              <div className="stat-value small warning">{stats.breakEvenGames}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg Days to Sell</div>
              <div className="stat-value small">{Math.round(stats.avgDaysToSell)} days</div>
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="stats-section">
          <h2>📦 Inventory Status</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Available</div>
              <div className="stat-value">{stats.availableCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Posted Online</div>
              <div className="stat-value">{stats.postedCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Not Posted</div>
              <div className="stat-value">{stats.notPostedCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg Time in Collection</div>
              <div className="stat-value small">{Math.round(stats.avgTimeInCollection)} days</div>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="stats-section">
          <h2>🎯 Platform Breakdown</h2>
          <div className="platform-breakdown">
            {Object.entries(stats.platformStats)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([platform, data]) => (
                <div key={platform} className="platform-row">
                  <div className="platform-name">{platform}</div>
                  <div className="platform-stats">
                    <span className="platform-count">{data.count} games</span>
                    <span className="platform-value">{formatCurrency(convertCurrency(data.value, 'USD', currency), currency)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Condition Breakdown */}
        <div className="stats-section">
          <h2>📋 Condition Breakdown</h2>
          <div className="condition-breakdown">
            {Object.entries(stats.conditionStats)
              .sort((a, b) => b[1] - a[1])
              .map(([condition, count]) => (
                <div key={condition} className="condition-row">
                  <div className="condition-name">{condition}</div>
                  <div className="condition-count">{count} games</div>
                  <div className="condition-bar">
                    <div
                      className="condition-fill"
                      style={{ width: `${(count / stats.totalGames) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Acquisition Source Analytics */}
        {stats.acquisitionSourceStats && Object.keys(stats.acquisitionSourceStats).length > 0 && (
          <div className="stats-section">
            <h2>🛒 Acquisition Source Analytics</h2>
            <div className="acquisition-source-breakdown">
              {Object.entries(stats.acquisitionSourceStats)
                .sort((a, b) => b[1].avgProfit - a[1].avgProfit)
                .map(([source, data]) => (
                  <div key={source} className="source-card">
                    <div className="source-header">
                      <h3 className="source-name">{source}</h3>
                      <div className="source-count">{data.count} games</div>
                    </div>
                    <div className="source-stats">
                      <div className="source-stat">
                        <span className="source-label">Avg Purchase:</span>
                        <span className="source-value">{formatCurrency(convertCurrency(data.avgPurchase, 'USD', currency), currency)}</span>
                      </div>
                      <div className="source-stat">
                        <span className="source-label">Avg Profit:</span>
                        <span className={`source-value ${data.avgProfit >= 0 ? 'profit' : 'loss'}`}>
                          {data.avgProfit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(data.avgProfit, 'USD', currency), currency)}
                        </span>
                      </div>
                      <div className="source-stat">
                        <span className="source-label">Total Spent:</span>
                        <span className="source-value">{formatCurrency(convertCurrency(data.totalPurchase, 'USD', currency), currency)}</span>
                      </div>
                      <div className="source-stat">
                        <span className="source-label">Total Profit:</span>
                        <span className={`source-value ${data.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                          {data.totalProfit >= 0 ? '+' : ''}{formatCurrency(convertCurrency(data.totalProfit, 'USD', currency), currency)}
                        </span>
                      </div>
                      <div className="source-stat">
                        <span className="source-label">Games Sold:</span>
                        <span className="source-value">{data.soldCount} / {data.count}</span>
                      </div>
                      {data.soldCount > 0 && data.totalPurchase > 0 && (
                        <div className="source-stat">
                          <span className="source-label">ROI:</span>
                          <span className={`source-value ${(data.totalProfit / data.totalPurchase * 100) >= 0 ? 'profit' : 'loss'}`}>
                            {((data.totalProfit / data.totalPurchase) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--card-bg)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>💡 Best Deals</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Best Average Profit:</strong> {
                  Object.entries(stats.acquisitionSourceStats)
                    .filter(([_, data]) => data.soldCount > 0)
                    .sort((a, b) => b[1].avgProfit - a[1].avgProfit)[0]?.[0] || 'N/A'
                }
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Most Acquisitions:</strong> {
                  Object.entries(stats.acquisitionSourceStats)
                    .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'
                }
              </p>
            </div>
          </div>
        )}

        {/* Top Games */}
        {stats.mostValuableGame && (
          <div className="stats-section">
            <h2>👑 Most Valuable Game</h2>
            <div className="highlight-game">
              <div className="game-info">
                {stats.mostValuableGame.igdb_cover_url && (
                  <img src={stats.mostValuableGame.igdb_cover_url} alt={stats.mostValuableGame.name} />
                )}
                <div>
                  <div className="game-name">{stats.mostValuableGame.name}</div>
                  <div className="game-platform">{stats.mostValuableGame.platform}</div>
                </div>
              </div>
              <div className="game-value">{formatCurrency(convertCurrency(stats.mostValuableGame.marketUSD, 'USD', currency), currency)}</div>
            </div>
          </div>
        )}

        {stats.bestProfitSale && (
          <div className="stats-section">
            <h2>🏆 Best Profit Sale</h2>
            <div className="highlight-game">
              <div className="game-info">
                {stats.bestProfitSale.igdb_cover_url && (
                  <img src={stats.bestProfitSale.igdb_cover_url} alt={stats.bestProfitSale.name} />
                )}
                <div>
                  <div className="game-name">{stats.bestProfitSale.name}</div>
                  <div className="game-platform">{stats.bestProfitSale.platform}</div>
                </div>
              </div>
              <div className="game-value profit">
                +{formatCurrency(convertCurrency((stats.bestProfitSale.soldUSD - stats.bestProfitSale.purchaseUSD), 'USD', currency), currency)}
              </div>
            </div>
          </div>
        )}

        {/* Top 5 Most Valuable */}
        {stats.top5Valuable && stats.top5Valuable.length > 0 && (
          <div className="stats-section">
            <h2>💎 Top 5 Most Valuable Games</h2>
            <div className="top-games-list">
              {stats.top5Valuable.map((game, idx) => (
                <div key={game.id} className="top-game-item">
                  <div className="rank">#{idx + 1}</div>
                  <div className="game-info">
                    {game.igdb_cover_url && (
                      <img src={game.igdb_cover_url} alt={game.name} />
                    )}
                    <div>
                      <div className="game-name">{game.name}</div>
                      <div className="game-platform">{game.platform}</div>
                    </div>
                  </div>
                  <div className="game-value">{formatCurrency(convertCurrency(game.marketUSD, 'USD', currency), currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Appreciation */}
        {stats.priceAppreciation && stats.priceAppreciation.length > 0 && (
          <div className="stats-section">
            <h2>📈 Top Price Appreciation</h2>
            <div className="top-games-list">
              {stats.priceAppreciation.map((item, idx) => (
                <div key={item.game.id} className="top-game-item">
                  <div className="rank">#{idx + 1}</div>
                  <div className="game-info">
                    {item.game.igdb_cover_url && (
                      <img src={item.game.igdb_cover_url} alt={item.game.name} />
                    )}
                    <div>
                      <div className="game-name">{item.game.name}</div>
                      <div className="game-platform">{item.game.platform}</div>
                    </div>
                  </div>
                  <div className="game-value appreciation">
                    +{formatCurrency(convertCurrency(item.appreciation, 'USD', currency), currency)} ({item.appreciationPercent.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yearly Financials */}
        {renderYearlyFinancials()}

        {/* Monthly Trends */}
        {renderMonthlyTrends()}

        {/* Calendar */}
        {renderCalendar()}
      </div>
    </div>
  );
}

export default StatisticsPage;
