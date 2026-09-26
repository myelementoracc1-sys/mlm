# Fast Forward (FF) - MLM / Referral Rewards Management Platform

Fast Forward (FF) is a real-time, full-stack multi-level marketing (MLM) and referral rewards platform built with **Next.js (App Router)**, **TypeScript**, **Prisma ORM**, **SQLite**, **Tailwind CSS**, and **Vitest**.

The platform manages member accounts, multi-wallet balances derived from an immutable double-entry ledger, versioned multi-tier compensation plans, genealogy and matrix trees, progression phases, administrative controls, and secure integration APIs for external e-hailing applications.

---

## Technical Architecture & Tech Stack

* **Frontend**: Next.js 15 (App Router, Server Actions & Client Components), Tailwind CSS, Lucide React Icons.
* **Backend**: Next.js API Route Handlers, Node.js, TypeScript.
* **Database & ORM**: SQLite (`dev.db`), Prisma ORM (Versioned Schema, Transactions, Cascades).
* **Security & Auth**: Bcryptjs password hashing, JWT HTTP-only session cookies, role-based access control (`MEMBER`, `ADMIN`, `SUPER_ADMIN`), SHA-256 hashed API Keys for external services.
* **Financial Accounting**: Auditable double-entry immutable ledger (`LedgerTransaction`), `Decimal.js` precision currency math, derived wallet balances (`MemberWallet`) denominated in South African Rand (ZAR / R).
* **Testing**: Vitest automated unit & integration test runner.

---

## Core Features

1. **Member Portal**:
   * Personal overview, FF member code, referral link & sponsor details.
   * Derived wallet balances (`FF`, `RIDE`, `CASH`, `PETROL_CARD`) in ZAR (R).
   * Visual genealogy explorer (sponsor tree & matrix tree).
   * Itemized commission awards with calculation & wallet breakdown explanations.
   * Cash withdrawal interface (safely held in unconfigured/disabled compliance state).

2. **Administrator Portal**:
   * System metrics dashboard (total members, active members, derived wallet liabilities, generated rewards).
   * Member directory search, hierarchy inspection, and account suspension/reactivation.
   * Versioned compensation plan manager (rules definition, fixed/%, caps, overflow destinations).
   * Generic wallet definition manager & progression phase manager.
   * System ledger browser with compensating reversal transaction dialog.
   * Immutable system audit log.
   * API Key manager for external integration credentials.

3. **External E-Hailing Integration API**:
   * Protected endpoint (`/api/v1/external/events`) for qualifying events (passenger rides, driver subscriptions, referrals).
   * Secured by `x-api-key` header with SHA-256 hashed validation.
   * Idempotent event processing pipeline wrapped in atomic database transactions.

---

## Installation & Setup Instructions

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database Schema
```bash
npx prisma db push
npx prisma generate
```

### Step 3: Seed Demonstration Data
```bash
npm run seed
```

---

## Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## Demonstration Credentials

The seed script creates the following accounts:

| Role | Email | Password | Code / Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@fastforward.com` | `Password123!` | Full System Access |
| **Admin** | `admin@fastforward.com` | `Password123!` | Management Portal |
| **Member Root** | `member.root@fastforward.com` | `Password123!` | Code: `FF100000` |
| **Member Alpha** | `member.alpha@fastforward.com` | `Password123!` | Code: `FF100001` |
| **API Key (E-Hailing)** | N/A | N/A | `ff_live_demo_key_99887766554433221100aabbccdd` |

---

## Running Automated Tests

Run the full Vitest suite covering authentication, matrix validation, unconfirmed spillover rejection, compensation calculations, caps & overflow, ledger immutability, reversals, and idempotency:

```bash
npm test
```

---

## Future E-Hailing / Mobile Integration Guide

External applications can submit qualifying events to Fast Forward by sending a `POST` request to:

`POST /api/v1/external/events`

### Headers:
* `Content-Type: application/json`
* `x-api-key: ff_live_demo_key_99887766554433221100aabbccdd`

### Request Payload Example (Completed Passenger Ride):
```json
{
  "eventType": "PASSENGER_RIDE",
  "sourceMemberId": "cm123...",
  "sourceSystem": "E_HAILING_APP",
  "externalReference": "RIDE_TRIP_987654",
  "monetaryBasis": 145.50,
  "metadata": {
    "pickup": "Sandton",
    "dropoff": "OR Tambo International Airport"
  }
}
```

The Fast Forward engine validates the key, evaluates the active compensation plan version, computes wallet allocations across genealogy uplines, writes immutable double-entry ledger entries, and returns an idempotent confirmation.
