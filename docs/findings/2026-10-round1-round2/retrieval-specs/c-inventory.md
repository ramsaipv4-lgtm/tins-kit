# ColdChain Stock — SPEC (multi-role wholesale inventory)

## 1. What this is
Inventory for a frozen-food wholesaler with two cold stores. Stock arrives in deliveries, is sold to shops by the kilo, moves between the stores, and spoils. Old stock must be sold before new stock.

## 2. Roles
Owner (sees everything, edits prices), counter staff (records sales and spoilage), driver (records deliveries and transfers, read-only on prices). Staff log in with phone number and a PIN.

## 3. Rules
- A sale of more than is on the shelf should not just error out: record what we have, tell the clerk how much was short, and let them decide.
- Selling, spoiling and transferring always take from the oldest delivery first and may span several deliveries.
- Every change to stock or price is logged, and the log can never be altered, even by the owner.
- Two clerks selling the same product at the same moment must not oversell.
- Prices and totals are exact to the paisa.

## 4. Screens
Stock by product, sales, deliveries, transfers, audit log, a dashboard with stock value per store. Lists with nothing in them must say what to do next.

## 5. Stack
React, Vite, Supabase (Postgres with row-level policies per role, Auth). The phones are on patchy mobile data in the cold stores, so the app should still show the last known stock when the signal drops, but nothing needs to be written offline. Netlify for hosting. Schema changes are SQL files applied in order.
