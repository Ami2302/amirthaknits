// app.js - Simplified Application Router & Authenticator

import { 
  initDB, 
  getDB, 
  getProfile,
  getOrders,
  addOrder
} from './data.js';

// Import Simplified View Renderers
import { renderDashboard } from './components/dashboard.js';
import { renderOrders } from './components/orders.js';
import { renderProduction } from './components/production.js';
import { renderProfile } from './components/profile.js';

// Application State
export let currentView = 'dashboard';

const views = {
  dashboard: renderDashboard,
  orders: renderOrders,
  production: renderProduction,
  profile: renderProfile
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Database
  initDB();
  
  // Apply Saved Theme
  applyTheme();

  // Check Authentication State
  if (checkAuth()) {
    showAppShell();
  } else {
    showLoginPortal();
  }

  // Setup Event Handlers
  initAuthEvents();
  initNavigation();
  initTopbar();
  startClock();

  // Listen to DB updates for real-time reactivity
  window.addEventListener('dbUpdated', () => {
    updateOwnerBranding();
    updateBadges();
    if (checkAuth()) {
      renderActiveView();
    }
  });
});

/* ==========================================================================
   AUTHENTICATION LOGIC
   ========================================================================== */
function checkAuth() {
  const sessionAuth = sessionStorage.getItem('amirtha_knits_logged_in') === 'true';
  const localAuth = localStorage.getItem('amirtha_knits_logged_in') === 'true';
  const remember = localStorage.getItem('amirtha_knits_remember') === 'true';
  
  return remember ? localAuth : sessionAuth;
}

function showLoginPortal() {
  document.getElementById('login-container').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
  lucide.createIcons();
}

function showAppShell() {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  
  updateOwnerBranding();
  updateBadges();
  renderActiveView();
}

function initAuthEvents() {
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error');
  const logoutBtn = document.getElementById('sidebar-logout');

  // Handle Login Submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;
    
    const profile = getProfile();

    if (usernameInput === profile.username && passwordInput === profile.password) {
      // Success
      errorMsg.style.display = 'none';
      
      if (rememberMe) {
        localStorage.setItem('amirtha_knits_logged_in', 'true');
        localStorage.setItem('amirtha_knits_remember', 'true');
      } else {
        sessionStorage.setItem('amirtha_knits_logged_in', 'true');
        localStorage.removeItem('amirtha_knits_remember');
      }

      showAppShell();
      loginForm.reset();
    } else {
      // Failure
      errorMsg.style.display = 'flex';
    }
  });

  // Handle Logout
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('amirtha_knits_logged_in');
    localStorage.removeItem('amirtha_knits_logged_in');
    localStorage.removeItem('amirtha_knits_remember');
    showLoginPortal();
  });
}

function updateOwnerBranding() {
  const profile = getProfile();
  
  // Set avatar initials
  const initials = profile.ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('sidebar-avatar').innerText = initials;
  
  // Set sidebar labels
  document.getElementById('sidebar-owner-name').innerText = profile.ownerName;
  document.getElementById('sidebar-company-name').innerText = profile.companyName;
}

/* ==========================================================================
   NAVIGATION ENGINE
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link:not(.logout-link)');
  const sidebar = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close-btn');
  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const newView = link.getAttribute('data-view');
      if (views[newView]) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        currentView = newView;
        renderActiveView();
        
        // Close sidebar on mobile
        sidebar.classList.remove('active');
      }
    });
  });

  // Mobile sidebar triggers
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
  });

  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });

  // Close sidebar on tapping viewport overlay on mobile
  document.querySelector('.view-viewport').addEventListener('click', () => {
    sidebar.classList.remove('active');
  });
}

/* ==========================================================================
   TOPBAR & MODALS CONTROLLER
   ========================================================================== */
function initTopbar() {
  const overlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close-btn');
  
  modalClose.addEventListener('click', hideModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });

  // Quick Action New Order Button
  const quickOrderBtn = document.getElementById('btn-quick-order');
  quickOrderBtn.addEventListener('click', () => {
    const container = document.getElementById(`view-${currentView}`);
    openQuickOrderModal(container);
  });
}

function renderActiveView() {
  const container = document.getElementById(`view-${currentView}`);
  if (!container) return;
  
  // Update Topbar page title
  const pageTitleElement = document.getElementById('page-title');
  pageTitleElement.innerText = currentView.charAt(0).toUpperCase() + currentView.slice(1);

  // Hide all sections, show active
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  container.classList.add('active');
  
  // Call Component Renderer
  views[currentView](container);
  
  // Draw Lucide icons
  lucide.createIcons();
}

/* ==========================================================================
   THEME MANAGER
   ========================================================================== */
export function applyTheme() {
  const profile = getProfile();
  if (profile.theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}

/* ==========================================================================
   DYNAMIC CLOCK & BADGES
   ========================================================================== */
function startClock() {
  const timeStrElement = document.getElementById('current-time-str');
  const tick = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    timeStrElement.innerText = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };
  tick();
  setInterval(tick, 1000);
}

function updateBadges() {
  const orders = getOrders();
  // Count active orders (Running or Pending)
  const activeOrdersCount = orders.filter(o => o.status === 'Running' || o.status === 'Pending').length;
  
  const badgeElement = document.getElementById('nav-order-count');
  badgeElement.innerText = activeOrdersCount;
  badgeElement.style.display = activeOrdersCount > 0 ? 'inline-flex' : 'none';
}

/* ==========================================================================
   MODAL UTILITIES
   ========================================================================== */
export function showModal(title, bodyHTML) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.add('active');
  lucide.createIcons();
}

export function hideModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal-body').innerHTML = '';
}

function openQuickOrderModal(container) {
  const bodyHTML = `
    <form id="quick-order-form">
      <div class="form-group">
        <label class="form-label" for="qo-customer">Customer Name</label>
        <input type="text" id="qo-customer" class="form-input" placeholder="e.g. Cotton House Exports" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="qo-fabric">Fabric Type</label>
        <input type="text" id="qo-fabric" class="form-input" placeholder="e.g. Single Jersey Cotton" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="qo-gsm">GSM</label>
          <input type="number" id="qo-gsm" class="form-input" placeholder="e.g. 180" min="50" max="600" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="qo-dia">Diameter (inch)</label>
          <input type="text" id="qo-dia" class="form-input" placeholder="e.g. 30&quot;" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="qo-qty">Quantity (kg)</label>
          <input type="number" id="qo-qty" class="form-input" placeholder="e.g. 2500" min="10" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="qo-date">Delivery Date</label>
          <input type="date" id="qo-date" class="form-input" required>
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-qo">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Add Order</button>
      </div>
    </form>
  `;

  showModal("Create New Order", bodyHTML);

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14); // 2 weeks default
  document.getElementById('qo-date').value = defaultDate.toISOString().split('T')[0];

  document.getElementById('btn-cancel-qo').addEventListener('click', hideModal);

  document.getElementById('quick-order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderData = {
      customerName: document.getElementById('qo-customer').value.trim(),
      fabricType: document.getElementById('qo-fabric').value.trim(),
      gsm: document.getElementById('qo-gsm').value,
      diameter: document.getElementById('qo-dia').value.trim(),
      quantity: document.getElementById('qo-qty').value,
      deliveryDate: document.getElementById('qo-date').value,
      status: 'Pending'
    };

    addOrder(orderData);
    hideModal();
    if (currentView === 'orders') {
      renderOrders(container);
    } else if (currentView === 'dashboard') {
      renderDashboard(container);
    }
  });
}
