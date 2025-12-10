import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * PriceChart component for displaying price history
 * Can be used as a detailed chart or mini sparkline
 */
export default function PriceChart({ gameId, mode = 'detailed', onClose }) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchPriceHistory();
  }, [gameId, timeRange]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/games/${gameId}/price-history?range=${timeRange}`);
      setPriceData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return mode === 'detailed' ? <div className="loading">Loading price history...</div> : null;
  }

  if (error || !priceData || priceData.history.length === 0) {
    return mode === 'detailed' ? <div className="error">{error || 'No price history available'}</div> : null;
  }

  // Prepare chart data
  const labels = priceData.history.map(entry => {
    const date = new Date(entry.recorded_at);
    return mode === 'detailed'
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
  });

  const values = priceData.history.map(entry => entry.market_value);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Market Value',
        data: values,
        borderColor: mode === 'mini' ? '#8b5cf6' : '#a78bfa',
        backgroundColor: mode === 'mini' ? 'transparent' : 'rgba(167, 139, 250, 0.1)',
        borderWidth: mode === 'mini' ? 1.5 : 2,
        tension: 0.3,
        fill: mode === 'detailed',
        pointRadius: mode === 'mini' ? 0 : 3,
        pointHoverRadius: mode === 'mini' ? 0 : 5,
        pointBackgroundColor: '#a78bfa',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: mode === 'detailed',
    plugins: {
      legend: {
        display: mode === 'detailed',
        labels: {
          color: '#e5e7eb'
        }
      },
      tooltip: {
        enabled: mode === 'detailed',
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return `$${context.parsed.y.toFixed(2)}`;
          },
          afterLabel: (context) => {
            const entry = priceData.history[context.dataIndex];
            return `Source: ${entry.source}`;
          }
        }
      },
      title: {
        display: mode === 'detailed',
        text: `Price History - ${priceData.game.name}`,
        color: '#f9fafb',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: mode === 'detailed' ? {
      x: {
        grid: {
          color: '#374151',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: '#374151',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          callback: (value) => `$${value}`
        },
        beginAtZero: false
      }
    } : {
      x: { display: false },
      y: { display: false }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Mini sparkline mode
  if (mode === 'mini') {
    return (
      <div className="price-chart-mini">
        <Line data={chartData} options={options} height={40} />
      </div>
    );
  }

  // Detailed modal mode
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content price-chart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Price History</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="price-chart-info">
          <div className="info-item">
            <span className="label">Game:</span>
            <span className="value">{priceData.game.name} ({priceData.game.platform})</span>
          </div>
          <div className="info-item">
            <span className="label">Current Value:</span>
            <span className="value">${priceData.game.current_market_value?.toFixed(2) || 'N/A'}</span>
          </div>
          {priceData.price_change !== null && (
            <div className="info-item">
              <span className="label">Change ({priceData.range}):</span>
              <span className={`value ${priceData.price_change >= 0 ? 'positive' : 'negative'}`}>
                {priceData.price_change >= 0 ? '+' : ''}{priceData.price_change.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="time-range-selector">
          <button
            className={timeRange === '7d' ? 'active' : ''}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button
            className={timeRange === '30d' ? 'active' : ''}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button
            className={timeRange === '90d' ? 'active' : ''}
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
          <button
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>

        <div className="chart-container">
          <Line data={chartData} options={options} />
        </div>

        <div className="price-history-table">
          <h3>Price History Records</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {priceData.history.slice().reverse().map((entry, index) => (
                <tr key={index}>
                  <td>{new Date(entry.recorded_at).toLocaleString()}</td>
                  <td>${entry.market_value.toFixed(2)}</td>
                  <td className={`source-badge source-${entry.source}`}>{entry.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
