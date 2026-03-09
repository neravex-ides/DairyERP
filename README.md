<!-- HERO HEADER -->
<div align="center">

<img src="assets/images/logo.png" alt="DairyERP Logo" width="90" height="90" style="border-radius:24px;box-shadow:0 16px 40px rgba(0,0,0,0.45);margin-bottom:8px;">

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
  <img src="https://img.shields.io/badge/Auth-Firebase_Auth-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Auth">
</p>

---

## 🔭 Overview

**DairyERP** is a modern, cloud‑ready ERP UI for:

- Dairy farms  
- Milk collection centers  
- Co‑operative societies  

The focus is on **daily operations**:

- Morning / evening **milk collection**
- **Farmer & customer** master records
- **Payments in / out** with simple ledgers
- (Template ready) **cattle feed – khal & churi** stock and issue
- A clean **dashboard** with milk + payments summary

The whole app is:

- Frontend: **HTML + CSS + Vanilla JS**  
- Auth: **Firebase Authentication** (Email/Password + Google)  
- Hosting: **GitHub Pages** (static, no backend server required)  

---

## ✨ UI Highlights

### 🎨 Design System

- **Color palette:** sky blue, white, dark grey  
- **Fonts:**  
  - `Poppins` – main UI  
  - `Amaranth` – brand / logo text  
- **Layout:**  
  - Left sidebar navigation (desktop)  
  - Top app header with actions  
  - Card‑based dashboard  

---

### 🔐 Premium Auth Experience

Landing / login page is fully custom‑designed:

- **Left side:** iOS‑style black mobile screen
  - DairyERP logo
  - “Smart Dairy In Every Operation” tagline
  - Glassy **Get Access** button
- **Right side:** peach‑colored luxury login card
  - Tabs: **Sign In / Create Account**
  - **Continue with Google** (Firebase popup)
  - Email + password form
  - Primary sky gradient **“Continue to login”** button
  - Secondary black **“Create free account”** button

All auth routes (`login.html`, `register.html`, `index.html`) use Firebase Auth,  
so you can plug your own Firebase config in `js/app.js`.

---

## 📊 Core ERP Modules

### 🏠 Dashboard (`pages/dashboard.html`)

A quick overview for the day:

- **Total milk collected today** (liters)
- **Number of active farmers today**
- **Payments today:**
  - Money received from customers
  - Approx. pending amount (farmer payout – customer receipts)
- **Recent milk entries** – last 10 milk collection rows
- **Recent payments** – last 10 payment rows

All numbers are calculated from stored records (localStorage or Firestore).

---

### 👨‍🌾 Farmers / Suppliers (`pages/farmers.html`)

Manage your milk suppliers:

- Farmer master fields:
  - Code (e.g. F001, F002…)
  - Name
  - Mobile
  - Address / Village
- Simple add & edit UI with live table
- Farmers appear in:
  - Milk collection farmer dropdown
  - Farmer‑side payments (we pay them)

---

### 🧑‍💼 Customers / Buyers (`pages/customers.html`)

Track who is buying milk:

- Customer master fields:
  - Name
  - Mobile
  - Address / Shop
- Customers appear in:
  - Payments (customer receipts)
  - Sales module (template)

Ideal for B2B buyers, bulk customers, collection points, etc.

---

### 🥛 Milk Collection (`pages/milk-collection.html`)

Daily collection register:

- Pick:
  - Farmer
  - Date
  - Shift (Morning / Evening)
- Enter:
  - Quantity (Liters)
  - Rate (₹/Litre)
- System auto‑calculates **Amount**

Collected entries feed the **Dashboard** and can be extended to Firestore.

---

### 💰 Payments (`pages/payments.html`)

Single screen for both in‑coming and out‑going payments:

- Party type:
  - **Farmer (debit)** – payment you give to farmer
  - **Customer (credit)** – payment you receive from buyer
- Fields:
  - Party (farmer / customer)
  - Date
  - Mode: Cash / Bank / UPI
  - Amount
  - Notes
- Dashboard shows:
  - Total received today
  - Approx. pending

---

### 🌾 Cattle Feed (Khal & Churi) – Template (`pages/cattle-feed.html`)

UI & JS hooks are ready for full cattle‑feed tracking:

- **New Stock:**
  - Item type: Khal / Churi
  - Quantity (kg)
  - Date
- **Issue to farmer:**
  - Farmer
  - Item
  - Quantity (kg)
  - Date
- Simple **Current Stock** card (Khal & Churi)
- **Recent issues** table

You can easily extend it to update farmer ledger / costing inside `js/app.js`.

---

### 📈 Sales & Reports – Template Pages

To keep the project lightweight but future‑proof, these pages are:

- `pages/sales.html` – Milk sales & invoicing (design ready, logic optional)
- `pages/reports.html` – Summary reports & export
- `pages/settings.html` – Branding, rate configuration etc.
- `pages/help.html` – Help, FAQ, contact

They follow the same dashboard shell so you can plug your own business logic later.

---

## 🧠 Tech Stack Details

### Frontend

- **HTML5** – semantic layout  
- **CSS3** – custom properties, Grid, Flexbox, glassmorphism  
- **JavaScript (Vanilla)** – no heavy framework

### Auth / Data

- **Firebase Authentication**
  - Email & Password
  - Google OAuth (popup)
  - Password reset via email
- **Firestore / localStorage** (you can choose)
  - The code is written so basic ERP data can be stored in browser or migrated to Firestore collections.

### Hosting

- **GitHub Pages**
  - Static deployment: no server, just HTML+CSS+JS
  - Perfect for demos, small dairies, personal projects

---

## 🗂 Project Structure

```text
DairyERP/
  index.html               # Landing / quick sign-in
  login.html               # Auth: login form
  register.html            # Auth: create dairy account

  css/
    style.css              # Complete UI theme (auth + dashboard)

  js/
    app.js                 # Firebase init, auth flows, ERP logic

  assets/
    images/
      logo.png             # App logo used across UI & README
      favicon.png          # Browser favicon

  pages/
    dashboard.html         # Main dashboard
    milk-collection.html   # Daily milk collection
    payments.html          # Payments in/out
    farmers.html           # Farmer master
    customers.html         # Customer master
    cattle-feed.html       # Khal & Churi module (template logic)
    sales.html             # Sales (template)
    reports.html           # Reports & exports (template)
    settings.html          # Global settings (template)
    help.html              # Help & support

    privacy-policy.html    # Static info pages
    terms-conditions.html
    refund-policy.html
