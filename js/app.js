// app.js - Simplified Application Router & Authenticator

import { 
  initDB, 
  getDB, 
  getProfile,
  getOrders,
  addOrder,
  registerProfile,
  updateTheme
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

  // Screen Switching
  const gotoSignup = document.getElementById('goto-signup');
  const gotoLogin = document.getElementById('goto-login');
  const loginScreen = document.getElementById('login-screen');
  const signupScreen = document.getElementById('signup-screen');
  const usernameFeedback = document.getElementById('username-feedback');
  const strengthContainer = document.getElementById('password-strength-container');

  const resetSignUpValidationFeedbacks = () => {
    if (usernameFeedback) usernameFeedback.style.display = 'none';
    if (strengthContainer) strengthContainer.style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('signup-error').style.display = 'none';
  };

  if (gotoSignup && gotoLogin) {
    gotoSignup.addEventListener('click', (e) => {
      e.preventDefault();
      loginScreen.style.display = 'none';
      signupScreen.style.display = 'block';
      resetSignUpValidationFeedbacks();
    });

    gotoLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signupScreen.style.display = 'none';
      loginScreen.style.display = 'block';
      resetSignUpValidationFeedbacks();
    });
  }

  // Password Show/Hide Toggle
  const passwordToggles = document.querySelectorAll('.password-toggle-btn');
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.previousElementSibling;
      const eyeIcon = toggle.querySelector('.eye-icon');
      const eyeOffIcon = toggle.querySelector('.eye-off-icon');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeIcon) eyeIcon.style.display = 'none';
        if (eyeOffIcon) eyeOffIcon.style.display = 'inline-block';
      } else {
        input.type = 'password';
        if (eyeIcon) eyeIcon.style.display = 'inline-block';
        if (eyeOffIcon) eyeOffIcon.style.display = 'none';
      }
    });
  });

  // Username Availability Check
  const usernameInput = document.getElementById('signup-username');
  if (usernameInput && usernameFeedback) {
    usernameInput.addEventListener('input', () => {
      const val = usernameInput.value.trim();
      if (val.length === 0) {
        usernameFeedback.style.display = 'none';
        return;
      }
      const profile = getProfile();
      // Simple UI-only simulation checking if matches existing administrator username
      if (val.toLowerCase() === profile.username.toLowerCase()) {
        usernameFeedback.style.display = 'block';
        usernameFeedback.style.color = 'var(--color-danger)';
        usernameFeedback.innerText = 'Username is already taken';
      } else {
        usernameFeedback.style.display = 'block';
        usernameFeedback.style.color = 'var(--color-success)';
        usernameFeedback.innerText = 'Username is available';
      }
    });
  }

  // Password Strength Indicator
  const passwordInput = document.getElementById('signup-password');
  const strengthBar = document.getElementById('password-strength-bar');
  const strengthLabel = document.getElementById('password-strength-label');

  if (passwordInput && strengthContainer && strengthBar && strengthLabel) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (val.length === 0) {
        strengthContainer.style.display = 'none';
        return;
      }

      strengthContainer.style.display = 'block';
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[A-Z]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

      if (score <= 1) {
        strengthBar.style.width = '25%';
        strengthBar.style.backgroundColor = 'var(--color-danger)';
        strengthLabel.innerText = 'Password Strength: Weak';
        strengthLabel.style.color = 'var(--color-danger)';
      } else if (score === 2) {
        strengthBar.style.width = '50%';
        strengthBar.style.backgroundColor = 'var(--color-warning)';
        strengthLabel.innerText = 'Password Strength: Medium';
        strengthLabel.style.color = 'var(--color-warning)';
      } else if (score === 3) {
        strengthBar.style.width = '75%';
        strengthBar.style.backgroundColor = 'var(--color-info)';
        strengthLabel.innerText = 'Password Strength: Good';
        strengthLabel.style.color = 'var(--color-info)';
      } else if (score === 4) {
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = 'var(--color-success)';
        strengthLabel.innerText = 'Password Strength: Strong';
        strengthLabel.style.color = 'var(--color-success)';
      }
    });
  }

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

  // Handle Sign Up Submit
  const signupForm = document.getElementById('signup-form');
  const signupError = document.getElementById('signup-error');
  const signupErrorText = document.getElementById('signup-error-text');
  const signupSuccess = document.getElementById('signup-success');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-fullname').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      signupError.style.display = 'none';
      signupSuccess.style.display = 'none';

      // Passwords match validation
      if (password !== confirmPassword) {
        signupErrorText.innerText = "Passwords do not match.";
        signupError.style.display = 'flex';
        return;
      }

      // Password length check
      if (password.length < 6) {
        signupErrorText.innerText = "Password must be at least 6 characters.";
        signupError.style.display = 'flex';
        return;
      }

      // Double check availability
      const profile = getProfile();
      if (username.toLowerCase() === profile.username.toLowerCase()) {
        signupErrorText.innerText = "Username is already taken.";
        signupError.style.display = 'flex';
        return;
      }

      // Save credentials & phone
      registerProfile(fullName, username, email, password, phone);

      signupSuccess.style.display = 'flex';
      signupForm.reset();
      resetSignUpValidationFeedbacks();

      setTimeout(() => {
        signupScreen.style.display = 'none';
        loginScreen.style.display = 'block';
        signupSuccess.style.display = 'none';
        document.getElementById('login-username').value = username;
      }, 1500);
    });
  }

  // Handle Logout
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('amirtha_knits_logged_in');
    localStorage.removeItem('amirtha_knits_logged_in');
    localStorage.removeItem('amirtha_knits_remember');
    showLoginPortal();
  });

  // Handle Theme Toggle Clicks
  initThemeToggles();
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
  updateThemeToggleUI(profile.theme);
}

function updateThemeToggleUI(theme) {
  const portalToggle = document.getElementById('portal-theme-toggle');
  const topbarToggle = document.getElementById('topbar-theme-toggle');

  [portalToggle, topbarToggle].forEach(btn => {
    if (!btn) return;
    const sunIcon = btn.querySelector('.theme-icon-sun');
    const moonIcon = btn.querySelector('.theme-icon-moon');
    if (theme === 'light') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'inline-block';
    } else {
      if (sunIcon) sunIcon.style.display = 'inline-block';
      if (moonIcon) moonIcon.style.display = 'none';
    }
  });
}

function initThemeToggles() {
  const portalToggle = document.getElementById('portal-theme-toggle');
  const topbarToggle = document.getElementById('topbar-theme-toggle');

  const handleToggle = () => {
    const profile = getProfile();
    const nextTheme = profile.theme === 'light' ? 'dark' : 'light';
    updateTheme(nextTheme);
    applyTheme();
  };

  if (portalToggle) {
    // Clone to prevent duplicate listeners
    const newToggle = portalToggle.cloneNode(true);
    portalToggle.parentNode.replaceChild(newToggle, portalToggle);
    newToggle.addEventListener('click', handleToggle);
  }
  if (topbarToggle) {
    const newToggle = topbarToggle.cloneNode(true);
    topbarToggle.parentNode.replaceChild(newToggle, topbarToggle);
    newToggle.addEventListener('click', handleToggle);
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
