// production.js - Simplified Production Registry linked to Orders

import { 
  getProductionEntries, 
  getOrders, 
  addProductionEntry, 
  editProductionEntry, 
  deleteProductionEntry 
} from '../data.js';
import { showModal, hideModal } from '../app.js';

export function renderProduction(container) {
  const entries = getProductionEntries();
  const orders = getOrders().filter(o => o.status === 'Running' || o.status === 'Pending');

  // Generate options for order selectors
  const orderOptions = orders.map(o => `
    <option value="${o.id}">${o.id} - ${o.customerName} (${o.fabricType})</option>
  `).join('');

  // Machine options listing
  const avinashiMachines = Array.from({ length: 30 }, (_, i) => `A${(i + 1).toString().padStart(2, '0')}`);
  const aadukalamMachines = Array.from({ length: 7 }, (_, i) => `K${(i + 1).toString().padStart(2, '0')}`);
  
  const machineOptions = `
    <optgroup label="Avinashi Unit (30)">
      ${avinashiMachines.map(m => `<option value="${m}">${m}</option>`).join('')}
    </optgroup>
    <optgroup label="Aadukalam Unit (7)">
      ${aadukalamMachines.map(m => `<option value="${m}">${m}</option>`).join('')}
    </optgroup>
  `;

  container.innerHTML = `
    <!-- Header -->
    <div class="view-header">
      <div class="view-title-area">
        <h1>Production Logging</h1>
        <p>Log daily outputs on specific knitting machines linked to active customer orders</p>
      </div>
      <div class="view-actions">
        <span class="badge badge-accent">Total Entries: ${entries.length}</span>
      </div>
    </div>

    <!-- Layout Split: History Table (Left) & Quick Log Panel (Right) -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; align-items:start;">
      
      <!-- Left: Production History Table -->
      <div class="panel-card table-container-card">
        <div class="table-card-header">
          <h3>Production Entry Logs</h3>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Date</th>
                <th>Order ID</th>
                <th>Machine</th>
                <th>Fabric Type</th>
                <th>Quantity (kg)</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${entries.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
                    No production entries logged yet.
                  </td>
                </tr>
              ` : entries.map(pe => {
                return `
                  <tr>
                    <td><strong>${pe.id}</strong></td>
                    <td>${new Date(pe.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td><span class="badge badge-accent">${pe.orderId}</span></td>
                    <td><span class="badge badge-off">${pe.machineNumber}</span></td>
                    <td>${pe.fabricType}</td>
                    <td><strong>${pe.quantity} kg</strong></td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button class="btn btn-secondary btn-sm btn-edit-entry" data-id="${pe.id}" style="padding: 4px 8px; margin-right:4px;">
                        <i data-lucide="edit" style="width:12px;height:12px;"></i>
                      </button>
                      <button class="btn btn-danger btn-sm btn-delete-entry" data-id="${pe.id}" style="padding: 4px 8px;">
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

      <!-- Right: Quick Log Panel Form -->
      <div class="panel-card">
        <h3 style="font-family: var(--font-family-display); font-size: 16px; font-weight:600; margin-bottom: 18px; display:flex; align-items:center; gap:8px;">
          <i data-lucide="plus-circle" style="color:var(--color-primary); width:20px; height:20px;"></i>
          <span>Log Output Entry</span>
        </h3>

        ${orders.length === 0 ? `
          <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid var(--color-warning-border); padding: 16px; border-radius: var(--radius-md); font-size:12px; color: var(--text-secondary); line-height: 1.4;">
            <i data-lucide="alert-triangle" style="color:var(--color-warning); width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:6px;"></i>
            <strong>No active orders.</strong> To log a production batch, go to the <strong>Orders</strong> tab and create or activate an order (Pending / Running).
          </div>
        ` : `
          <form id="production-quick-form">
            <div class="form-group">
              <label class="form-label" for="pq-date">Date</label>
              <input type="date" id="pq-date" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="pq-order">Sales Order ID</label>
              <select id="pq-order" class="form-select" required>
                <option value="">-- Select Order --</option>
                ${orderOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="pq-machine">Machine Number</label>
              <select id="pq-machine" class="form-select" required>
                <option value="">-- Select Machine --</option>
                ${machineOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="pq-fabric">Fabric Type</label>
              <input type="text" id="pq-fabric" class="form-input" placeholder="Select order to fill..." readonly required>
            </div>

            <div class="form-group">
              <label class="form-label" for="pq-qty">Production Quantity (kg)</label>
              <input type="number" id="pq-qty" class="form-input" min="1" max="10000" placeholder="e.g. 150" required>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 10px;">
              <i data-lucide="save"></i>
              <span>Save Entry</span>
            </button>
          </form>
        `}
      </div>

    </div>
  `;

  // Pre-fill today's date in form
  const dateInput = document.getElementById('pq-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Bind dropdown auto-complete fabric type
  const orderSelect = document.getElementById('pq-order');
  const fabricInput = document.getElementById('pq-fabric');
  
  if (orderSelect) {
    orderSelect.addEventListener('change', () => {
      const selectedId = orderSelect.value;
      if (!selectedId) {
        fabricInput.value = '';
        return;
      }
      
      const allOrders = getOrders();
      const currentOrder = allOrders.find(o => o.id === selectedId);
      if (currentOrder) {
        fabricInput.value = currentOrder.fabricType;
      }
    });
  }

  // Bind Form Submit
  const form = document.getElementById('production-quick-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const entryData = {
        date: dateInput.value,
        orderId: orderSelect.value,
        machineNumber: document.getElementById('pq-machine').value,
        fabricType: fabricInput.value,
        quantity: document.getElementById('pq-qty').value
      };

      addProductionEntry(entryData);
      
      // Reset form (except date)
      form.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      
      renderProduction(container);
    });
  }

  // Bind Edit Action Buttons
  const editBtns = container.querySelectorAll('.btn-edit-entry');
  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const entryId = btn.getAttribute('data-id');
      openEditEntryModal(container, entryId);
    });
  });

  // Bind Delete Action Buttons
  const deleteBtns = container.querySelectorAll('.btn-delete-entry');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const entryId = btn.getAttribute('data-id');
      if (confirm(`Are you sure you want to delete Production Entry ${entryId}?`)) {
        deleteProductionEntry(entryId);
        renderProduction(container);
      }
    });
  });
}

function openEditEntryModal(container, entryId) {
  const entries = getProductionEntries();
  const entry = entries.find(pe => pe.id === entryId);
  const activeOrders = getOrders();

  if (!entry) return;

  const orderOptions = activeOrders.map(o => `
    <option value="${o.id}" ${entry.orderId === o.id ? 'selected' : ''}>${o.id} - ${o.customerName} (${o.fabricType})</option>
  `).join('');

  const avinashiMachines = Array.from({ length: 30 }, (_, i) => `A${(i + 1).toString().padStart(2, '0')}`);
  const aadukalamMachines = Array.from({ length: 7 }, (_, i) => `K${(i + 1).toString().padStart(2, '0')}`);

  const machineOptions = `
    <optgroup label="Avinashi Unit (30)">
      ${avinashiMachines.map(m => `<option value="${m}" ${entry.machineNumber === m ? 'selected' : ''}>${m}</option>`).join('')}
    </optgroup>
    <optgroup label="Aadukalam Unit (7)">
      ${aadukalamMachines.map(m => `<option value="${m}" ${entry.machineNumber === m ? 'selected' : ''}>${m}</option>`).join('')}
    </optgroup>
  `;

  const bodyHTML = `
    <form id="edit-entry-form">
      <div class="form-group">
        <label class="form-label" for="ee-date">Date</label>
        <input type="date" id="ee-date" class="form-input" value="${entry.date}" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="ee-order">Sales Order ID</label>
        <select id="ee-order" class="form-select" required>
          ${orderOptions}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="ee-machine">Machine Number</label>
        <select id="ee-machine" class="form-select" required>
          ${machineOptions}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="ee-fabric">Fabric Type</label>
        <input type="text" id="ee-fabric" class="form-input" value="${entry.fabricType}" readonly required>
      </div>

      <div class="form-group">
        <label class="form-label" for="ee-qty">Production Quantity (kg)</label>
        <input type="number" id="ee-qty" class="form-input" value="${entry.quantity}" min="1" max="10000" required>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-ee">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save Entry</button>
      </div>
    </form>
  `;

  showModal(`Edit Production Entry ${entryId}`, bodyHTML);

  const editOrderSelect = document.getElementById('ee-order');
  const editFabricInput = document.getElementById('ee-fabric');

  editOrderSelect.addEventListener('change', () => {
    const selectedId = editOrderSelect.value;
    const currentOrder = activeOrders.find(o => o.id === selectedId);
    if (currentOrder) {
      editFabricInput.value = currentOrder.fabricType;
    }
  });

  document.getElementById('btn-cancel-ee').addEventListener('click', hideModal);

  document.getElementById('edit-entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updatedData = {
      date: document.getElementById('ee-date').value,
      orderId: editOrderSelect.value,
      machineNumber: document.getElementById('ee-machine').value,
      fabricType: editFabricInput.value,
      quantity: document.getElementById('ee-qty').value
    };

    editProductionEntry(entryId, updatedData);
    hideModal();
    renderProduction(container);
  });
}
