# Fast Forward (FF) - Pending & Unresolved Business Rules

This document explicitly records all unresolved, unconfirmed, or pending MLM business rules within the **Fast Forward (FF)** system as required by product specifications.

To prevent financial drift or arbitrary assumptions, Fast Forward treats each of these items as **administrator-configurable** or represents them **explicitly as unconfigured/disabled** until confirmed.

---

## 1. Matrix Spillover Placement Algorithm
* **Status**: UNCONFIRMED / STRATEGY BOUNDARY ENFORCED
* **Description**: The 6th direct referral (and subsequent referrals) beyond the 5-wide matrix capacity is expected to spill into an available downline matrix position. However, the exact spillover traversal algorithm (e.g. left-to-right balanced depth-first vs top-to-bottom breadth-first vs sponsor-preferred branch) is unconfirmed.
* **System Behavior**: The system provides direct position placement (`placeMemberInMatrixDirect`) and enforces an explicit placement boundary. Automatic spillover placement explicitly throws an `UNRESOLVED_BUSINESS_RULE` exception rather than guessing placement order.

## 2. Earning Depth & Level-by-Level Commission Rates
* **Status**: ADMINISTRATOR-CONFIGURABLE
* **Description**: The specific percentage or fixed monetary commission assigned to each genealogy depth level (Level 1, Level 2, Level 3, etc.) across various qualifying events remains unconfirmed for future plan revisions.
* **System Behavior**: All commission percentages and fixed amounts are stored in versioned compensation plan rules (`CommissionRule`). No compensation rates are buried in source code.

## 3. Passenger Ride Monetary Basis
* **Status**: ADMINISTRATOR-CONFIGURABLE
* **Description**: It is unconfirmed whether passenger ride commission calculations are calculated on the **total ride gross fare** or on a defined **net commission pool**.
* **System Behavior**: Commission rules support explicit selection of calculation basis (`TOTAL_VALUE`, `COMMISSION_POOL`, or `FIXED_BASE`).

## 4. Wallet Caps & Overflow Behavior
* **Status**: ADMINISTRATOR-CONFIGURABLE
* **Description**: Fast Forward wallets (such as FF Wallet and Ride Wallet) have intended default caps (e.g. R 100 for FF, R 50 for Ride). The exact conditions under which capped excess flows to the Cash wallet or another destination are subject to ongoing policy confirmation.
* **System Behavior**: Wallet definitions and commission rules support optional `cap` values and `overflowDestinationCode`. Overflow amounts are tracked deterministically in calculation awards and ledger entries.

## 5. Driver Subscription Caps & Overflow Rules
* **Status**: ADMINISTRATOR-CONFIGURABLE
* **Description**: Driver subscription commissions default to a 50% FF Wallet / 50% Petrol Card Wallet split. Potential caps and overflow destinations for driver wallets are unconfirmed.
* **System Behavior**: Driver subscription rules are configurable without hardcoded wallet caps.

## 6. Progression Phase Names, Qualification Thresholds, & Benefits
* **Status**: ADMINISTRATOR-CONFIGURABLE / UNCONFIGURED STATE
* **Description**: Phase names (e.g., Bronze, Silver, Gold), exact earnings thresholds, team size requirements, and associated system benefits are unconfirmed.
* **System Behavior**: Fast Forward includes a dynamic progression engine (`evaluateMemberPhase`). If no active phase definition matches a member's metric, the member portal explicitly displays the phase as unconfigured rather than assuming arbitrary default phases.

## 7. Cash Wallet Withdrawal Parameters
* **Status**: DISABLED / UNCONFIGURED STATE
* **Description**: Cash wallet withdrawal rules—including minimum/maximum payout amounts, processing fee percentages, approval workflows, payout channels, and processing windows—are unconfirmed.
* **System Behavior**: The Member Portal withdrawal interface displays a clear informational notice explaining that withdrawals are disabled pending administrative rule confirmation. The database schema supports `WithdrawalStatus.DISABLED`.
