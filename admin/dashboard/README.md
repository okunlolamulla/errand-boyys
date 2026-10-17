# Errand Boys Admin Dashboard (Next.js)

Next.js 14 (App Router) + React 18, plain JavaScript, no UI libraries. Talks to the `errand-boys-api` backend.

## Run it
1. Start the API first (see its README), on port 4000, with `CORS_ORIGINS=http://localhost:3000`.
2. Here: copy `.env.local.example` to `.env.local` (Windows: `copy .env.local.example .env.local`).
   `NEXT_PUBLIC_API_URL` must point at the API.
3. `npm install`, then `npm run dev`, then open http://localhost:3000 and sign in with your Supabase admin account.

## What's on screen
| Tab | Component | What it does |
|---|---|---|
| Incoming requests | `RequestsTable` | New and quoted errands. **Send quote** opens `QuoteModal`; **Mark paid** is the manual fallback |
| Paid & assignment | `AssignmentTable` + `AssignAgent` | Dropdown of **active agents** for paid errands; reassign until work starts |
| Status monitor | `StatusMonitor` + `ErrandDetailModal` | Board of In Progress / Proof Uploaded / Completed. Open a card to review proof, approve, or **close the request** |

**Quoting modal:** enter a price in NGN or USD, tick email and/or WhatsApp, press *Save quote & send link*. The server saves the
quote, creates the Paystack link and sends it. The modal then shows whether each channel succeeded.

**Closing:** a Completed errand closes with an optional note. Closing anything else needs a reason, and asks you to confirm.

## Request details and customer photos
The errand detail window shows the answers from the customer's service form (grocery list, brands, budget, supermarket, landmark; or move type, floors, packing help, special handling) and links to the photos they attached (valid for 1 hour).

## Agent dashboard (`/agent`)
Agents open http://localhost:3000/agent and sign in with their own account (agent accounts cannot use the admin page, and vice versa).
- **Assigned jobs list:** only the agent's own jobs, refreshed every 30 seconds. Active jobs first, completed ones below.
- **Status buttons:** On the way, In progress, Completed. Buttons that no longer apply are disabled. **Completed** opens the proof form.
- **Completion proof:** a note and/or up to 5 photos or PDFs. Photos are shrunk in the browser first so phone uploads are fast.
  Submitting sets the errand to *Proof Uploaded*; the agent sees "Awaiting confirmation" until an admin approves it.
- **WhatsApp quick-link:** opens a chat with the customer, pre-filled with `Hi <name>, this is <agent> from Errand Boys about your errand EB-XXXXXX`. A Call button is next to it.
Set `NEXT_PUBLIC_DEFAULT_COUNTRY_CODE` (default 234) if agents' customers are outside Nigeria.

## Files
```
app/        layout, page, global styles (brand colours)
components/ AdminApp + Dashboard (admin), AgentApp + AgentDashboard + JobCard + ProofModal (agents), shared Modal, LoginForm, StatusBadge
lib/        api.js (fetch wrapper), useAuth.js (sign-in + token), format.js (money, dates)
```
The list refreshes every 30 seconds and after every action. The token is kept in `sessionStorage` (cleared when the tab closes).

## Good to know
- Messages are sent by the **API**, not the browser, so no keys live in this app. Nothing here is secret.
- Until a payment gateway, Resend and WhatsApp are configured on the API, quotes still save and the modal says which channel was skipped.
- **Payments:** an errand's detail window lists each payment attempt (paid / pending / stale / mismatch). Payments that arrived but couldn't be applied show as a red warning on the dashboard until you mark them reviewed.
- **Assigning** an agent also notifies the agent and the customer; the result appears under the dropdown.
- Not included: agent dashboard, create-errand form, customers/agents management screens, tests.
- This was syntax-checked but never opened in a browser. Expect small fixes on the first run.
