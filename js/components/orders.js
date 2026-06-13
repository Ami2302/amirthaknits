// orders.js - Textile ERP-style Orders Management Module

import { getOrders, addOrder, editOrder, deleteOrder, getProductionEntries } from '../data.js';
import { showModal, hideModal } from '../app.js';

let activeStatusFilter = 'all';
let searchQuery = '';

export function renderOrders(container) {
  const orders = getOrders();
  const production = getProductionEntries();

  // Filter orders by search query and status tab
  const filteredOrders = orders.filter(o => {
    const matchesStatus = activeStatusFilter === 'all' || o.status.toLowerCase() === activeStatusFilter.toLowerCase();
    
    const yarn = o.yarnType || '';
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.fabricType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          yarn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  container.innerHTML = `
    <!-- Header -->
    <div class="view-header">
      <div class="view-title-area">
        <h1>Fabric Orders Registry (ERP)</h1>
        <p>Monitor fabric production specifications, gauges, raw material types, priorities, and remaining loads</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary btn-sm" id="btn-add-order">
          <i data-lucide="plus-circle"></i>
          <span>Create New Order</span>
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="filter-bar">
      <div class="search-wrapper">
        <i data-lucide="search"></i>
        <input type="text" id="order-search" class="search-input" placeholder="Search by ID, customer, fabric, yarn..." value="${searchQuery}">
      </div>
      
      <div class="filter-group">
        <span class="form-label" style="margin-right: 8px;">Filter:</span>
        <button class="pill-filter ${activeStatusFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="pill-filter ${activeStatusFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
        <button class="pill-filter ${activeStatusFilter === 'running' ? 'active' : ''}" data-filter="running">Running</button>
        <button class="pill-filter ${activeStatusFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completed</button>
        <button class="pill-filter ${activeStatusFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">Delivered</button>
      </div>
    </div>

    <!-- ERP-style Table Card -->
    <div class="panel-card table-container-card">
      <div class="table-card-header">
        <h3>Production Order Queue</h3>
        <span class="badge badge-accent">${filteredOrders.length} Order(s) in View</span>
      </div>
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Fabric specs</th>
              <th>Yarn Type</th>
              <th>Gauge</th>
              <th>Target Load</th>
              <th>Produced</th>
              <th>Remaining</th>
              <th>Progress</th>
              <th>Delivery Date</th>
              <th>Status</th>
              <th style="text-align: right; min-width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr>
                <td colspan="13" style="text-align:center; padding:30px; color:var(--text-muted);">
                  No order records found matching the active search filters.
                </td>
              </tr>
            ` : filteredOrders.map(o => {
              // Calculate produced vs remaining
              const produced = production
                .filter(pe => pe.orderId === o.id)
                .reduce((sum, item) => sum + item.quantity, 0);
              const remaining = Math.max(0, o.quantity - produced);
              const progressPct = Math.min(100, Math.round((produced / o.quantity) * 100));

              // Priority tags
              let priorityBadge = 'badge-off';
              if (o.priority === 'High') priorityBadge = 'badge-danger';
              else if (o.priority === 'Medium') priorityBadge = 'badge-warning';

              // Status tags
              let statusBadge = 'badge-warning';
              if (o.status === 'Running') statusBadge = 'badge-success';
              else if (o.status === 'Completed') statusBadge = 'badge-info';
              else if (o.status === 'Delivered') statusBadge = 'badge-off';

              return `
                <tr>
                  <td><span class="badge ${priorityBadge}">${o.priority || 'Normal'}</span></td>
                  <td><strong>${o.id}</strong></td>
                  <td><strong>${o.customerName}</strong></td>
                  <td>
                    <div style="font-size: 11px; color: var(--text-secondary);">${o.fabricType}</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top:2px;">${o.gsm} GSM | Dia: ${o.diameter}</div>
                  </td>
                  <td style="font-size: 11px;">${o.yarnType || 'Cotton 30s'}</td>
                  <td><span class="badge badge-accent">${o.machineGauge || '24 GG'}</span></td>
                  <td><strong>${o.quantity} kg</strong></td>
                  <td style="color: var(--color-success); font-weight:600;">${produced} kg</td>
                  <td style="color: ${remaining > 0 ? 'var(--color-warning)' : 'var(--text-muted)'}; font-weight:600;">${remaining} kg</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <div class="progress-bar-container" style="width:70px; height:6px;">
                        <div class="progress-bar-fill" style="width: ${progressPct}%; background-color: var(--color-${o.status === 'Running' ? 'success' : (o.status === 'Completed' ? 'info' : (o.status === 'Delivered' ? 'off' : 'warning'))});"></div>
                      </div>
                      <span style="font-size:11px; font-weight:600;">${progressPct}%</span>
                    </div>
                  </td>
                  <td>${new Date(o.deliveryDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span class="badge ${statusBadge}">${o.status}</span></td>
                  <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-secondary btn-sm btn-view-details" data-id="${o.id}" title="View Complete details" style="padding: 4px 8px; margin-right:4px;">
                      <i data-lucide="eye" style="width:12px;height:12px;"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm btn-edit-order" data-id="${o.id}" style="padding: 4px 8px; margin-right:4px;">
                      <i data-lucide="edit" style="width:12px;height:12px;"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-order" data-id="${o.id}" style="padding: 4px 8px;">
                      <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Bind Create Order
  document.getElementById('btn-add-order').addEventListener('click', () => {
    openOrderFormModal(container, null);
  });

  // Bind Search
  const searchInput = document.getElementById('order-search');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearTimeout(window.orderSearchTimeout);
    window.orderSearchTimeout = setTimeout(() => {
      renderOrders(container);
    }, 250);
  });

  // Bind Filters
  const filters = container.querySelectorAll('.pill-filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      activeStatusFilter = btn.getAttribute('data-filter');
      renderOrders(container);
    });
  });

  // Bind Detail Modal Buttons
  const viewBtns = container.querySelectorAll('.btn-view-details');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      openOrderDetailsModal(orderId, orders, production);
    });
  });

  // Bind Edits
  const editBtns = container.querySelectorAll('.btn-edit-order');
  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      openOrderFormModal(container, orderId);
    });
  });

  // Bind Deletes
  const deleteBtns = container.querySelectorAll('.btn-delete-order');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-id');
      if (confirm(`Are you sure you want to delete Order ${orderId}? This deletes its production logs too.`)) {
        deleteOrder(orderId);
        renderOrders(container);
      }
    });
  });
}

function openOrderDetailsModal(orderId, orders, production) {
  const o = orders.find(item => item.id === orderId);
  if (!o) return;

  const linkedLogs = production.filter(pe => pe.orderId === o.id);
  const produced = linkedLogs.reduce((sum, item) => sum + item.quantity, 0);
  const remaining = Math.max(0, o.quantity - produced);
  const progressPct = Math.min(100, Math.round((produced / o.quantity) * 100));

  let priorityBadge = 'badge-off';
  if (o.priority === 'High') priorityBadge = 'badge-danger';
  else if (o.priority === 'Medium') priorityBadge = 'badge-warning';

  let statusBadge = 'badge-warning';
  if (o.status === 'Running') statusBadge = 'badge-success';
  else if (o.status === 'Completed') statusBadge = 'badge-info';
  else if (o.status === 'Delivered') statusBadge = 'badge-off';

  const bodyHTML = `
    <div style="display:flex; flex-direction:column; gap:24px;">
      
      <!-- Upper Section Grid -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; background:var(--bg-tertiary); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <!-- Specs Column -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Customer & Fabric</div>
            <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-top:2px;">${o.customerName}</div>
            <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${o.fabricType} (${o.gsm} GSM - ${o.diameter})</div>
          </div>
          <div>
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Material Parameters</div>
            <div style="font-size:13px; color:var(--text-primary); margin-top:2px;"><strong>Yarn:</strong> ${o.yarnType || 'Cotton 30s'}</div>
            <div style="font-size:13px; color:var(--text-primary); margin-top:2px;"><strong>Cylinder Gauge:</strong> ${o.machineGauge || '24 GG'}</div>
          </div>
          <div style="display:flex; gap:16px; align-items:center;">
            <div>
              <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Priority</div>
              <span class="badge ${priorityBadge}" style="margin-top:4px;">${o.priority || 'Normal'}</span>
            </div>
            <div>
              <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Delivery Target</div>
              <div style="font-size:12px; font-weight:600; color:var(--text-primary); margin-top:4px;">${new Date(o.deliveryDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <!-- Production Summary Column -->
        <div style="display:flex; flex-direction:column; gap:12px; border-left:1px solid var(--border-color); padding-left:20px;">
          <div>
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Status</div>
            <span class="badge ${statusBadge}" style="margin-top:4px; font-size:12px; padding:4px 10px;">${o.status}</span>
          </div>
          <div>
            <div style="font-size:10px; color:var(--text-secondary); text-transform:uppercase; font-weight:600; margin-bottom:4px;">Production Yield Progress</div>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
              <span>${produced} kg of ${o.quantity} kg</span>
              <span>${progressPct}%</span>
            </div>
            <div class="progress-bar-container" style="height:8px;">
              <div class="progress-bar-fill" style="width: ${progressPct}%; background-color: var(--color-${o.status === 'Running' ? 'success' : (o.status === 'Completed' ? 'info' : (o.status === 'Delivered' ? 'off' : 'warning'))});"></div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:rgba(0,0,0,0.15); padding:8px; border-radius:var(--radius-sm);">
            <div>
              <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase;">Produced</div>
              <div style="font-size:13px; font-weight:700; color:var(--color-success);">${produced} kg</div>
            </div>
            <div>
              <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase;">Remaining</div>
              <div style="font-size:13px; font-weight:700; color:var(--color-warning);">${remaining} kg</div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Table Section -->
      <div>
        <h4 style="font-family: var(--font-family-display); font-size:14px; font-weight:600; margin-bottom:12px; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
          <i data-lucide="history" style="width:16px;height:16px;color:var(--color-primary);"></i>
          <span>Linked Production Entries History</span>
        </h4>
        
        <div class="table-responsive" style="max-height: 200px; border:1px solid var(--border-color); border-radius:var(--radius-md);">
          <table class="custom-table" style="font-size:12px;">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Date</th>
                <th>Machine</th>
                <th>Output Qty</th>
              </tr>
            </thead>
            <tbody>
              ${linkedLogs.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted);">
                    No production entries logged under this order.
                  </td>
                </tr>
              ` : linkedLogs.map(pe => `
                <tr>
                  <td><strong>${pe.id}</strong></td>
                  <td>${new Date(pe.date).toLocaleDateString()}</td>
                  <td><span class="badge badge-off">${pe.machineNumber}</span></td>
                  <td><strong>${pe.quantity} kg</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Action -->
      <div style="display:flex; justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" id="btn-close-details" style="padding: 8px 16px;">Close Details</button>
      </div>

    </div>
  `;

  showModal(`Order Verification: ${orderId}`, bodyHTML);
  document.getElementById('btn-close-details').addEventListener('click', hideModal);
}

function openOrderFormModal(container, orderId = null) {
  const isEdit = !!orderId;
  let order = {
    customerName: '',
    fabricType: '',
    gsm: 180,
    diameter: '30"',
    quantity: 1000,
    deliveryDate: '',
    status: 'Pending',
    yarnType: 'Cotton 30s Combed',
    machineGauge: '24 GG',
    priority: 'Normal'
  };

  if (isEdit) {
    const orders = getOrders();
    const found = orders.find(o => o.id === orderId);
    if (found) order = found;
  } else {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    order.deliveryDate = defaultDate.toISOString().split('T')[0];
  }

  // Predefine options lists
  const gaugeOptions = ['20 GG', '24 GG', '28 GG'].map(g => `
    <option value="${g}" ${order.machineGauge === g ? 'selected' : ''}>${g}</option>
  `).join('');

  const priorityOptions = ['Normal', 'Medium', 'High'].map(p => `
    <option value="${p}" ${order.priority === p ? 'selected' : ''}>${p}</option>
  `).join('');

  const bodyHTML = `
    <form id="order-crud-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="of-customer">Customer / Buyer</label>
          <input type="text" id="of-customer" class="form-input" value="${order.customerName}" placeholder="e.g. Aura Apparels" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="of-priority">Priority</label>
          <select id="of-priority" class="form-select" required>
            ${priorityOptions}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="of-fabric">Fabric Specification</label>
        <input type="text" id="of-fabric" class="form-input" value="${order.fabricType}" placeholder="e.g. Interlock Cotton" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="of-gsm">Fabric GSM</label>
          <input type="number" id="of-gsm" class="form-input" value="${order.gsm}" placeholder="e.g. 220" min="50" max="600" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="of-dia">Diameter (inch)</label>
          <input type="text" id="of-dia" class="form-input" value="${order.diameter}" placeholder="e.g. 30&quot;" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="of-yarn">Yarn Type (Material)</label>
          <input type="text" id="of-yarn" class="form-input" value="${order.yarnType}" placeholder="e.g. Cotton 40s Combed" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="of-gauge">Machine Cylinder Gauge</label>
          <select id="of-gauge" class="form-select" required>
            ${gaugeOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="of-qty">Target Load Quantity (kg)</label>
          <input type="number" id="of-qty" class="form-input" value="${order.quantity}" placeholder="e.g. 1500" min="10" required>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="of-date">Target Delivery Date</label>
          <input type="date" id="of-date" class="form-input" value="${order.deliveryDate}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="of-status">Order Status</label>
        <select id="of-status" class="form-select" required>
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending (Awaiting Scheduling)</option>
          <option value="Running" ${order.status === 'Running' ? 'selected' : ''}>Running (Knitting in Progress)</option>
          <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed (Awaiting Dispatch)</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered (Closed)</option>
        </select>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-of">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Save Changes' : 'Add Order'}</button>
      </div>
    </form>
  `;

  showModal(isEdit ? `Edit Order ${orderId}` : "Create New Sales Order", bodyHTML);

  document.getElementById('btn-cancel-of').addEventListener('click', hideModal);

  document.getElementById('order-crud-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderData = {
      customerName: document.getElementById('of-customer').value.trim(),
      fabricType: document.getElementById('of-fabric').value.trim(),
      gsm: document.getElementById('of-gsm').value,
      diameter: document.getElementById('of-dia').value.trim(),
      quantity: document.getElementById('of-qty').value,
      deliveryDate: document.getElementById('of-date').value,
      status: document.getElementById('of-status').value,
      yarnType: document.getElementById('of-yarn').value.trim(),
      machineGauge: document.getElementById('of-gauge').value,
      priority: document.getElementById('of-priority').value
    };

    if (isEdit) {
      editOrder(orderId, orderData);
    } else {
      addOrder(orderData);
    }

    hideModal();
    renderOrders(container);
  });
}
