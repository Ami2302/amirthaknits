// profile.js - Profile & System Settings Module

import { getProfile, updateProfile, changePassword, updateTheme } from '../data.js';
import { applyTheme } from '../app.js';

export function renderProfile(container) {
  const profile = getProfile();

  container.innerHTML = `
    <!-- Header -->
    <div class="view-header">
      <div class="view-title-area">
        <h1>Profile & Settings</h1>
        <p>Manage company details, administrator credentials, and interface preferences</p>
      </div>
    </div>

    <!-- Profile Grid Layout -->
    <div class="profile-grid">
      
      <!-- Left: Configuration Details -->
      <div style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- Profile Info Card -->
        <div class="panel-card">
          <h3 style="font-family: var(--font-family-display); font-size: 16px; font-weight: 600; margin-bottom: 18px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="user-cog" style="color:var(--color-primary); width:20px; height:20px;"></i>
            <span>Owner & Company Information</span>
          </h3>

          <form id="profile-details-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prof-owner">Owner Name</label>
                <input type="text" id="prof-owner" class="form-input" value="${profile.ownerName}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-company">Company Name</label>
                <input type="text" id="prof-company" class="form-input" value="${profile.companyName}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prof-contact">Contact Number</label>
                <input type="text" id="prof-contact" class="form-input" value="${profile.contact}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-email">Email Address</label>
                <input type="email" id="prof-email" class="form-input" value="${profile.email}" required>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:10px;">
              <i data-lucide="save"></i>
              <span>Save Profile Details</span>
            </button>
          </form>
        </div>

        <!-- Password Change Card -->
        <div class="panel-card">
          <h3 style="font-family: var(--font-family-display); font-size: 16px; font-weight: 600; margin-bottom: 18px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="shield-alert" style="color:var(--color-warning); width:20px; height:20px;"></i>
            <span>Security Credentials</span>
          </h3>

          <form id="profile-password-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prof-newpass">New Password</label>
                <input type="password" id="prof-newpass" class="form-input" placeholder="Enter new password" required autocomplete="new-password">
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-confpass">Confirm Password</label>
                <input type="password" id="prof-confpass" class="form-input" placeholder="Re-type new password" required autocomplete="new-password">
              </div>
            </div>

            <div id="password-error" class="login-error-msg" style="display:none; margin-top:10px;">
              <i data-lucide="alert-circle"></i>
              <span>Passwords do not match. Please verify again.</span>
            </div>

            <div id="password-success" style="display:none; align-items:center; gap:8px; background-color: var(--color-success-bg); border: 1px solid var(--color-success-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-success); font-size: 12px; font-weight: 500; margin-bottom: 18px;">
              <i data-lucide="check-circle"></i>
              <span>Password updated successfully.</span>
            </div>

            <button type="submit" class="btn btn-secondary" style="margin-top:10px; border-color:var(--color-warning);">
              <i data-lucide="key-round"></i>
              <span>Change Password</span>
            </button>
          </form>
        </div>

      </div>

      <!-- Right: Appearance Settings -->
      <div style="display:flex; flex-direction:column; gap:24px;">
        
        <div class="panel-card">
          <h3 style="font-family: var(--font-family-display); font-size: 16px; font-weight: 600; margin-bottom: 18px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="palette" style="color:var(--color-info); width:20px; height:20px;"></i>
            <span>Visual Appearance</span>
          </h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom: 14px; line-height: 1.4;">
            Choose a visual theme style for your manufacturing dashboard:
          </p>

          <div class="theme-options">
            <div class="theme-card ${profile.theme === 'dark' ? 'active' : ''}" data-theme="dark">
              <i data-lucide="moon"></i>
              <span>Dark Theme</span>
            </div>
            
            <div class="theme-card ${profile.theme === 'light' ? 'active' : ''}" data-theme="light">
              <i data-lucide="sun"></i>
              <span>Light Theme</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Bind Details Form
  const detailsForm = document.getElementById('profile-details-form');
  detailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const profileData = {
      ownerName: document.getElementById('prof-owner').value.trim(),
      companyName: document.getElementById('prof-company').value.trim(),
      contact: document.getElementById('prof-contact').value.trim(),
      email: document.getElementById('prof-email').value.trim()
    };

    updateProfile(profileData);
    alert("Profile saved successfully.");
  });

  // Bind Password Form
  const passwordForm = document.getElementById('profile-password-form');
  const errorAlert = document.getElementById('password-error');
  const successAlert = document.getElementById('password-success');

  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('prof-newpass').value;
    const confPass = document.getElementById('prof-confpass').value;

    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    if (newPass !== confPass) {
      errorAlert.style.display = 'flex';
      return;
    }

    changePassword(newPass);
    successAlert.style.display = 'flex';
    passwordForm.reset();
  });

  // Bind Theme Selector Clicks
  const themeCards = container.querySelectorAll('.theme-card');
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const selectedTheme = card.getAttribute('data-theme');
      updateTheme(selectedTheme);
      applyTheme();
    });
  });
}
