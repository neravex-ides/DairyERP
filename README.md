<!-- HERO HEADER -->
<div align="center">

<img src="assets/images/logo.png" alt="DairyERP Logo" width="96" height="96" style="border-radius:24px;box-shadow:0 16px 40px rgba(0,0,0,0.28);margin-bottom:8px;">

# DairyERP  
### Cloud‑Ready Dairy & Milk Management ERP

</div>

---

<p align="center">
  <strong>Built & maintained by <a href="mailto:neravex_@outlook.com">Nirmal Chahil</a></strong><br>
  <a href="tel:+917232806098">📞 +91‑72328‑06098</a> ·
  <a href="mailto:neravex_@outlook.com">✉ neravex_@outlook.com</a>
</p>

<p align="center">
  <a href="https://neravex-ides.github.io/DairyERP/">
    <img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-2563EB?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-0ea5e9?style=for-the-badge&logo=html5&logoColor=white" alt="Frontend">
  <img src="https://img.shields.io/badge/Auth-Firebase_Auth-ffca28?style=for-the-badge&logo=firebase&logoColor=000" alt="Firebase Auth">
</p>

---

## 🔭 Overview

**DairyERP** is a modern, cloud‑ready ERP UI for:

- Dairy farms  
- Milk collection centers  
- Co‑operative societies  

It focuses on daily operations:

- Morning / evening **milk collection**
- Farmer & customer **master data**
- **Payments** (farmers / customers)
- Template‑ready **cattle feed (khal & churi)** module
- A clean **dashboard** showing milk, payments and recent activity

The entire app runs on:

- **HTML / CSS / Vanilla JavaScript**
- **Firebase Authentication** (Email/Password + Google)
- Hosted as a static site on **GitHub Pages**

---

## ✨ UI Highlights

### 🎨 Design System

- **Colors:** sky blue, white, dark grey
- **Fonts:**  
  - `Poppins` – UI text  
  - `Amaranth` – branding / logo text  
- **Layout:**  
  - Auth: iOS‑style phone + luxury peach login card  
  - App: sidebar + top header + cards

### 🔐 Premium Auth Screen

Landing / login screen:

- **Left:** iOS‑inspired black phone
  - DairyERP logo (`assets/images/logo.png`)
  - “Smart Dairy in Every Operation” tagline
  - Glassy **Get Access** button
- **Right:** Peach login card
  - Tabs: **Sign In / Create account**
  - **Continue with Google** (Firebase popup auth)
  - Email + Password login
  - Primary sky gradient button: **Continue to login**
  - Secondary black button: **New dairy? Create free account**

All Firebase hooks are handled in `js/app.js`  
(Google button uses `data-auth="google-landing"`, email form uses `landing-login-form`).

---

## 📊 Core ERP Modules

### 🏠 Dashboard – `pages/dashboard.html`

Shows high‑level stats for today:

- **Total milk collected** (L)
- **Number of farmers** who supplied milk
- **Payments today:**
  - Money received from customers
  - Approx. pending (farmer dues – customer receipts)
- **Recent milk entries** (last rows)
- **Recent payments** (last rows)

### 👨‍🌾 Farmers – `pages/farmers.html`

Farmer master:

- Code (F001, F002…)
- Name
- Phone
- Address / Village

Farmers are used in:

- Milk collection farmer dropdown
- Farmer payments

### 🧑‍💼 Customers – `pages/customers.html`

Customer master:

- Name
- Phone
- Address / Shop name

Customers appear in:

- Payments (customer receipts)
- Sales screens (template)

### 🥛 Milk Collection – `pages/milk-collection.html`

For every entry:

- Farmer  
- Date  
- Shift (Morning / Evening)  
- Quantity (Litre)  
- Rate (₹/L)

Auto‑calculated **Amount**, and data is available for dashboard / reports.

### 💰 Payments – `pages/payments.html`

Single screen for:

- **Farmer** payments (you pay out)
- **Customer** receipts (you collect)

Fields:

- Party type: Farmer / Customer  
- Party name  
- Date  
- Mode: Cash / Bank / UPI  
- Amount  
- Notes  

Dashboard uses these entries to compute **today’s payments** and **approx pending**.

### 🌾 Cattle Feed – `pages/cattle-feed.html`

Template‑ready UI:

- **New stock**: item (Khal/Churi), qty, date  
- **Issue to farmer**: farmer, item, qty, date  
- **Current stock** cards  
- **Recent issues** table  

JS hooks exist in `app.js` (`initFeedPage` etc.), so you can add your own business rules.

### 📈 Sales / Reports / Settings – Templates

For future expansion:

- `pages/sales.html` – Sales register  
- `pages/reports.html` – Summary reports & export  
- `pages/settings.html` – Branding, rate config  
- `pages/help.html` – Help & support info  

These pages already use the same dashboard shell and styling.

---

## 🧠 Tech Stack

**Frontend**

- HTML5, CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript (no framework)

**Backend / Auth**

- Firebase Authentication:
  - Email & Password
  - Google sign‑in
  - Password reset
- Optional Firestore usage (can be wired in `app.js`)
- In demo mode, many records can be stored in `localStorage` as well

**Hosting**

- Static hosting on **GitHub Pages**

---

## 🗂 Folder & File Structure

```text
DairyERP/
  index.html               # Landing + quick sign‑in
  login.html               # Login page
  register.html            # Create dairy account

  css/
    style.css              # Global theme (auth + app + pages)

  js/
    app.js                 # Firebase init + auth + ERP logic

  assets/
    images/
      logo.png             # App logo
      favicon.png          # Favicon

  pages/
    dashboard.html         # Dashboard overview
    milk-collection.html   # Daily milk collection
    payments.html          # Payments (farmers/customers)
    farmers.html           # Farmer master
    customers.html         # Customer master
    cattle-feed.html       # Khal & Churi module
    sales.html             # Sales (template)
    reports.html           # Reports (template)
    settings.html          # Settings (template)
    help.html              # Help & support

    privacy-policy.html    # Static info pages
    terms-conditions.html
    refund-policy.html
