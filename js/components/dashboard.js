// dashboard.js - Simplified Dashboard for Company Owner

import { getOrders, getProductionEntries } from '../data.js';

let dashboardChartInstance = null;

export function renderDashboard(container) {
  const orders = getOrders();
  const production = getProductionEntries();

  // 1. Establish Date Context (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  
  // KPI 1: Today's Production (kg)
  const todayEntries = production.filter(p => p.date === todayStr);
  const todayProductionKg = todayEntries.reduce((sum, item) => sum + item.quantity, 0);

  // KPI 2: Active Orders (Pending + Running status)
  const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Running');
  const activeOrdersCount = activeOrders.length;

  // KPI 3: Running Machines
  // Count distinct machine numbers that logged production today
  const runningMachinesSet = new Set(todayEntries.map(p => p.machineNumber));
  const runningMachinesCount = runningMachinesSet.size;

  // KPI 4: Pending Deliveries (Completed status)
  const pendingDeliveriesCount = orders.filter(o => o.status === 'Completed').length;

  // Render Layout
  container.innerHTML = `
    <!-- KPI Summary Grid -->
    <div class="stats-grid">
      <div class="panel-card stat-card">
        <div class="stat-info">
          <span class="stat-title">Today's Production</span>
          <span class="stat-value">${todayProductionKg} <span style="font-size: 16px; font-weight: 500;">kg</span></span>
          <span class="stat-meta">Fabric knitted today</span>
        </div>
        <div class="stat-icon-wrapper">
          <i data-lucide="activity"></i>
        </div>
      </div>

      <div class="panel-card stat-card">
        <div class="stat-info">
          <span class="stat-title">Active Orders</span>
          <span class="stat-value">${activeOrdersCount}</span>
          <span class="stat-meta">Pending & Running</span>
        </div>
        <div class="stat-icon-wrapper">
          <i data-lucide="shopping-bag"></i>
        </div>
      </div>

      <div class="panel-card stat-card">
        <div class="stat-info">
          <span class="stat-title">Running Machines</span>
          <span class="stat-value">${runningMachinesCount} <span style="font-size: 14px; font-weight: 500; color: var(--text-secondary);">/ 37</span></span>
          <span class="stat-meta">Active machine loops</span>
        </div>
        <div class="stat-icon-wrapper">
          <i data-lucide="cpu"></i>
        </div>
      </div>

      <div class="panel-card stat-card">
        <div class="stat-info">
          <span class="stat-title">Pending Deliveries</span>
          <span class="stat-value">${pendingDeliveriesCount}</span>
          <span class="stat-meta">Completed awaiting dispatch</span>
        </div>
        <div class="stat-icon-wrapper">
          <i data-lucide="truck"></i>
        </div>
      </div>
    </div>

    <!-- Charts & Running Orders Split -->
    <div class="charts-row">
      
      <!-- Left: Production Trend Chart -->
      <div class="panel-card chart-card">
        <div class="chart-header">
          <h3>Production Output Trend (Last 5 Days)</h3>
          <span class="badge badge-accent">Daily Yield (kg)</span>
        </div>
        <div class="chart-container">
          <canvas id="owner-dashboard-chart"></canvas>
        </div>
      </div>

      <!-- Right: Active Orders Tracker -->
      <div class="panel-card summary-details-card">
        <div class="chart-header">
          <h3>Active Orders Progress</h3>
          <span class="badge badge-warning">${activeOrdersCount} Total</span>
        </div>
        <div class="summary-list">
          ${activeOrders.length === 0 ? `
            <div style="text-align:center; padding:30px; color:var(--text-muted); font-size:12px;">
              No active orders at this time.
            </div>
          ` : activeOrders.map(order => {
            // Calculate progress percentage based on linked production entries
            const orderProduction = production
              .filter(pe => pe.orderId === order.id)
              .reduce((sum, item) => sum + item.quantity, 0);
            const progress = Math.min(100, Math.round((orderProduction / order.quantity) * 100));
            
            let statusColor = 'badge-warning';
            if (order.status === 'Running') statusColor = 'badge-success';

            return `
              <div class="summary-item">
                <div class="summary-item-left">
                  <span class="summary-item-name">${order.customerName}</span>
                  <span class="summary-item-sub">${order.fabricType} | GSM ${order.gsm} | ${order.quantity}kg</span>
                  
                  <div class="progress-bar-container" style="margin-top: 6px; width: 180px;">
                    <div class="progress-bar-fill" style="width: ${progress}%; background-color: var(--color-${order.status === 'Running' ? 'success' : 'warning'});"></div>
                  </div>
                </div>
                <div style="text-align: right; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                  <span class="badge ${statusColor}">${order.status}</span>
                  <span style="font-size:11px; font-weight:600; color:var(--text-primary);">${progress}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  // Draw trend charts
  setTimeout(() => {
    initOwnerChart(production);
  }, 50);
}

function initOwnerChart(production) {
  if (dashboardChartInstance) {
    dashboardChartInstance.destroy();
  }

  const ctx = document.getElementById('owner-dashboard-chart');
  if (!ctx) return;

  // Group production outputs dynamically by the last 5 calendar days
  const last5Days = [];
  const labels = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last5Days.push(dateStr);
    
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    labels.push(`${day < 10 ? '0' + day : day} ${month}`);
  }

  const dataPoints = last5Days.map(dateStr => {
    return production
      .filter(pe => pe.date === dateStr)
      .reduce((sum, item) => sum + item.quantity, 0);
  });

  dashboardChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Fabric Output (kg)',
        data: dataPoints,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}
