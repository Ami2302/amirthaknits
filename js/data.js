// data.js - Simplified Local Storage Database Manager for Amirtha Knits

const STORAGE_KEY = 'amirtha_knits_simplified_db';

// Helper to generate a relative calendar date string (YYYY-MM-DD)
const getTodayStr = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Initial Database Seed
const initialDB = {
  profile: {
    ownerName: 'Amirtha Ganesan',
    companyName: 'Amirtha Knits',
    contact: '+91 94437 12345',
    email: 'owner@amirthaknits.com',
    username: 'admin',
    password: 'admin123',
    theme: 'dark' // 'dark' or 'light'
  },
  orders: [
    { id: 'ORD-2026-001', customerName: 'Cotton House Exports', fabricType: 'Single Jersey Cotton', gsm: 180, diameter: '30"', quantity: 2500, deliveryDate: getTodayStr(-12), status: 'Running', yarnType: 'Cotton 30s Combed', machineGauge: '24 GG', priority: 'High' },
    { id: 'ORD-2026-002', customerName: 'Aura Apparels', fabricType: 'Interlock Cotton', gsm: 220, diameter: '30"', quantity: 1500, deliveryDate: getTodayStr(-2), status: 'Completed', yarnType: 'Cotton 40s Combed', machineGauge: '28 GG', priority: 'Normal' },
    { id: 'ORD-2026-003', customerName: 'Vanguard Knits', fabricType: 'Rib Polyester', gsm: 240, diameter: '34"', quantity: 4000, deliveryDate: getTodayStr(-19), status: 'Running', yarnType: 'Polyester 150D Semidull', machineGauge: '20 GG', priority: 'Medium' },
    { id: 'ORD-2026-004', customerName: 'Pioneer Brands', fabricType: 'Fleece Cotton-Poly', gsm: 280, diameter: '34"', quantity: 1200, deliveryDate: getTodayStr(-7), status: 'Pending', yarnType: 'Cotton-Poly Blend', machineGauge: '24 GG', priority: 'Normal' },
    { id: 'ORD-2026-005', customerName: 'Apex Garments', fabricType: 'Spandex Jersey', gsm: 160, diameter: '32"', quantity: 3000, deliveryDate: getTodayStr(5), status: 'Delivered', yarnType: 'Spandex 40D + Cotton 30s', machineGauge: '24 GG', priority: 'Normal' }
  ],
  production: [
    { id: 'PE-101', date: getTodayStr(0), orderId: 'ORD-2026-001', machineNumber: 'A01', fabricType: 'Single Jersey Cotton', quantity: 180 },
    { id: 'PE-102', date: getTodayStr(0), orderId: 'ORD-2026-001', machineNumber: 'A05', fabricType: 'Single Jersey Cotton', quantity: 120 },
    { id: 'PE-103', date: getTodayStr(0), orderId: 'ORD-2026-003', machineNumber: 'K02', fabricType: 'Rib Polyester', quantity: 150 },
    { id: 'PE-104', date: getTodayStr(1), orderId: 'ORD-2026-001', machineNumber: 'A12', fabricType: 'Single Jersey Cotton', quantity: 200 },
    { id: 'PE-105', date: getTodayStr(1), orderId: 'ORD-2026-003', machineNumber: 'K06', fabricType: 'Rib Polyester', quantity: 220 },
    { id: 'PE-106', date: getTodayStr(2), orderId: 'ORD-2026-002', machineNumber: 'A18', fabricType: 'Interlock Cotton', quantity: 350 },
    { id: 'PE-107', date: getTodayStr(3), orderId: 'ORD-2026-002', machineNumber: 'A20', fabricType: 'Interlock Cotton', quantity: 400 },
    { id: 'PE-108', date: getTodayStr(7), orderId: 'ORD-2026-005', machineNumber: 'A25', fabricType: 'Spandex Jersey', quantity: 500 }
  ]
};

// Initialize LocalStorage Database
export const initDB = () => {
  const SCHEMA_VERSION = 'v1.2';
  const savedVersion = localStorage.getItem('amirtha_knits_db_version');
  
  if (savedVersion !== SCHEMA_VERSION || !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    localStorage.setItem('amirtha_knits_db_version', SCHEMA_VERSION);
  }
};

// Fetch current database state
export const getDB = () => {
  initDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
};

// Save database state
export const saveDB = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('dbUpdated'));
};

/* ==========================================================================
   ORDERS LOGIC
   ========================================================================== */
export const getOrders = () => {
  const db = getDB();
  return db.orders;
};

export const addOrder = (orderData) => {
  const db = getDB();
  const orderId = `ORD-2026-${(db.orders.length + 1).toString().padStart(3, '0')}`;
  
  const newOrder = {
    id: orderId,
    customerName: orderData.customerName,
    fabricType: orderData.fabricType,
    gsm: Number(orderData.gsm),
    diameter: orderData.diameter,
    quantity: Number(orderData.quantity),
    deliveryDate: orderData.deliveryDate,
    status: orderData.status || 'Pending',
    yarnType: orderData.yarnType,
    machineGauge: orderData.machineGauge,
    priority: orderData.priority || 'Normal'
  };

  db.orders.push(newOrder);
  saveDB(db);
  return newOrder;
};

export const editOrder = (orderId, updatedData) => {
  const db = getDB();
  const index = db.orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    db.orders[index] = {
      ...db.orders[index],
      customerName: updatedData.customerName,
      fabricType: updatedData.fabricType,
      gsm: Number(updatedData.gsm),
      diameter: updatedData.diameter,
      quantity: Number(updatedData.quantity),
      deliveryDate: updatedData.deliveryDate,
      status: updatedData.status,
      yarnType: updatedData.yarnType,
      machineGauge: updatedData.machineGauge,
      priority: updatedData.priority
    };
    saveDB(db);
  }
};

export const deleteOrder = (orderId) => {
  const db = getDB();
  db.orders = db.orders.filter(o => o.id !== orderId);
  // Also clean up linked production entries (cascade delete optional, but clean)
  db.production = db.production.filter(pe => pe.orderId !== orderId);
  saveDB(db);
};

/* ==========================================================================
   PRODUCTION LOGIC
   ========================================================================== */
export const getProductionEntries = () => {
  const db = getDB();
  // Sort production entries by date descending, then ID descending
  return db.production.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addProductionEntry = (entryData) => {
  const db = getDB();
  const entryId = `PE-${randomRange(109, 999)}`;
  
  const newEntry = {
    id: entryId,
    date: entryData.date,
    orderId: entryData.orderId,
    machineNumber: entryData.machineNumber,
    fabricType: entryData.fabricType,
    quantity: Number(entryData.quantity)
  };

  db.production.push(newEntry);
  
  // Dynamic linking helper:
  // If the total production weight logged for this order matches/exceeds its quantity,
  // automatically suggest/update status to 'Completed'.
  const order = db.orders.find(o => o.id === entryData.orderId);
  if (order) {
    // If order was Pending, change it to Running since production is happening
    if (order.status === 'Pending') {
      order.status = 'Running';
    }
    
    // Check if total matches quantity
    const totalProduced = db.production
      .filter(pe => pe.orderId === order.id)
      .reduce((sum, item) => sum + item.quantity, 0);
      
    if (totalProduced >= order.quantity && order.status === 'Running') {
      order.status = 'Completed';
    }
  }

  saveDB(db);
  return newEntry;
};

export const editProductionEntry = (entryId, updatedData) => {
  const db = getDB();
  const index = db.production.findIndex(pe => pe.id === entryId);
  if (index !== -1) {
    db.production[index] = {
      ...db.production[index],
      date: updatedData.date,
      orderId: updatedData.orderId,
      machineNumber: updatedData.machineNumber,
      fabricType: updatedData.fabricType,
      quantity: Number(updatedData.quantity)
    };
    
    // Recalculate order status targets
    const order = db.orders.find(o => o.id === updatedData.orderId);
    if (order && order.status === 'Running') {
      const totalProduced = db.production
        .filter(pe => pe.orderId === order.id)
        .reduce((sum, item) => sum + item.quantity, 0);
        
      if (totalProduced >= order.quantity) {
        order.status = 'Completed';
      }
    }
    
    saveDB(db);
  }
};

export const deleteProductionEntry = (entryId) => {
  const db = getDB();
  db.production = db.production.filter(pe => pe.id !== entryId);
  saveDB(db);
};

/* ==========================================================================
   PROFILE & CONFIGURATION LOGIC
   ========================================================================== */
export const getProfile = () => {
  const db = getDB();
  return db.profile;
};

export const updateProfile = (profileData) => {
  const db = getDB();
  db.profile = {
    ...db.profile,
    ownerName: profileData.ownerName,
    companyName: profileData.companyName,
    contact: profileData.contact,
    email: profileData.email
  };
  saveDB(db);
};

export const updateTheme = (newTheme) => {
  const db = getDB();
  db.profile.theme = newTheme;
  saveDB(db);
};

export const changePassword = (newPassword) => {
  const db = getDB();
  db.profile.password = newPassword;
  saveDB(db);
};
