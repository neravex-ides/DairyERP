<!-- HERO HEADER -->
<div align="center">

<img src="assets/images/logo.png" alt="DairyERP Logo" width="72" height="72" style="border-radius:16px;">

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
  <a href="https://neravex-ides.github.io/DairyERP/"><img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-2563EB?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-0ea5e9?style=for-the-badge&logo=html5&logoColor=white" alt="Frontend">
  <img src="https://img.shields.io/badge/Auth-Firebase_Auth-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Auth">
</p>

---

## 🔭 Overview

**DairyERP** is a lightweight yet powerful web‑based ERP designed for dairy farms, milk collection centers and co‑operative societies.

It focuses on:

- Daily **milk collection** – farmer‑wise, morning & evening
- Master data for **farmers** and **customers**
- **Payments** in and out – farmer payout vs customer receipts
- (Template ready) **cattle feed (khal & churi)** stock and issue register
- A clean **dashboard** showing today’s milk, payments and recent activity

The entire app runs on:

- Pure **HTML / CSS / JavaScript**
- **Firebase Authentication** (Email/Password + Google)
- Deployed as a static site on **GitHub Pages**

---

## ✨ Features at a Glance

### 🔐 Authentication

- Secure login with **Firebase Authentication**
- **Email / Password** sign‑in & register
- **Sign in with Google** (popup auth)
- **Forgot password** via Firebase reset email
- All `/pages/*` routes are protected – unauthenticated access redirects to `login.html`.

---

### 📊 Dashboard

- **Milk collected (today)** – total quantity in liters  
- **Farmer count (today)** – unique farmers who supplied milk
- **Payments (today)**:
  - Total amount received from customers
  - Approx. pending (farmer payout – customer receipts)
- **Recent milk entries** (last 10 records)
- **Recent payments** (last 10 records)

---

### 👨‍🌾 Farmers / Suppliers

- Farmer master data:
  - Code (F001, F002, …)
  - Name
  - Phone
  - Address
- Simple add form with live table
- Used by milk collection and farmer payments dropdowns

---

### 🧑‍💼 Customers / Buyers

- Customer master data:
  - Name
  - Phone
  - Address
- Customers appear in payments module when recording receipts
- Useful for tracking B2B buyers, distributors, shops, etc.

---

### 🥛 Milk Collection

- Select farmer from master list
- Date and shift (Morning / Evening)
- Quantity (L) and rate with **auto amount calculation**
- Entries stored in browser localStorage (or easily extendable to Firestore)
- Dashboard is automatically refreshed:
  - Today’s total milk
  - Recent entries table

---

### 💰 Payments

- Party type:
  - **Farmer (we pay)** – outgoing payments
  - **Customer (they pay)** – incoming payments
- Party dropdown bound to farmers/customers accordingly
- Date, payment mode (Cash / Bank / UPI), amount & notes
- Dashboard reflects:
  - Total received today
  - Approximate pending

---

### 🌾 Cattle Feed – Khal & Churi (Template Ready)

The **cattle‑feed module** is fully templated with UI and IDs:

- **New stock**:
  - Item: Khal / Churi
  - Quantity (kg)
  - Date
- **Issue to farmer**:
  - Farmer select
  - Item
  - Quantity
  - Date
- **Current stock** summary for Khal & Churi
- **Recent issues** table

The HTML structure is complete and already wired in JS (`initFeedPage`) – ready for further business logic (e.g. linking to farmer ledger, costing, etc.).

---

## 🧠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no framework)
- **Auth & Backend:** Firebase Auth (+ optional Firestore integration)
- **Hosting:** GitHub Pages
- **Icons & Visuals:**
  - Emoji icons in sidebar (🥛, 🌾, 💰, 📊, …)
  - Optional Font Awesome support
- **Storage (demo mode):** Browser `localStorage` for ERP data

---

## 🗂 File & Folder Structure

```text
DairyERP/
  index.html               # Landing + quick sign-in (Email / Google)
  login.html               # Login (Email / Google / Forgot password)
  register.html            # Register new dairy account

  css/
    style.css              # Global theme: auth + dashboard + pages

  js/
    app.js                 # Firebase init + auth + ERP logic

  assets/
    images/
      logo.png             # App logo
      favicon.png          # Favicon

  pages/
    dashboard.html         # Dashboard (milk & payment summary + recent tables)
    milk-collection.html   # Daily milk collection (farmer-wise)
    payments.html          # Payments (farmers/customers)
    farmers.html           # Farmers master
    customers.html         # Customers master
    cattle-feed.html       # Khal & Churi stock / issue module
    sales.html             # Milk sales (template/placeholder)
    reports.html           # Reports & export (template/placeholder)
    settings.html          # Settings (template/placeholder)
    help.html              # Help & support text

    privacy-policy.html    # Static policy pages
    terms-conditions.html
    refund-policy.html