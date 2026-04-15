# GaiaSpeak Website

GaiaSpeak frontend for:

- GSG / GSS token experience
- Wristband marketing + pre-order interest
- Supabase-backed physical delivery queue with **1kg pooling logic**
- Admin monitoring panel with queue, progress, and completed oracle batches

## What’s implemented

### Wristband product experience

- Added `Wristband` navigation entry.
- Added new page: `/wristband` (`src/pages/WristbandPage.jsx`).
- Includes high-conversion CTA opening `PreOrderModal`.
- Includes product sample image from `public/brecelets.jpeg` with explicit note that it is a concept/sample (not final hardware).

### 1kg pooling physical delivery flow (mock-chain ready)

- New user flow component: `src/components/PhysicalDeliveryPool.jsx`.
- Real-time progress bar: grams collected toward 1,000g.
- Queue status: wallet-specific queue position + ETA estimate.
- Request form:
	1. Select token + grams (min 1g)
	2. Shipping fields (Country, City, Street, Postal Code)
	3. Confirmation message after submit

### Supabase backend integration

- Extended API helpers in `src/config/supabase.js` for:
	- active batch management
	- queue insertion
	- per-user queue status
	- completed batch history
	- realtime queue reads
- Realtime subscriptions in:
	- `src/hooks/usePhysicalDeliveryQueue.js`
	- `src/pages/AdminPage.jsx`

### Mock oracle batch processor

- New edge function: `supabase/functions/process-physical-batch/index.ts`
- Triggered from frontend after each request.
- If batch reaches 1,000g:
	- chooses cheapest verified mock supplier
	- marks active batch as completed
	- links queued requests to completed batch
	- opens next collecting batch

### Admin panel upgrade

- Updated `src/pages/AdminPage.jsx` to include:
	- Header + Sidebar layout
	- Current batch progress view
	- Current queue users table
	- Completed batch history and selected supplier
	- Wristband reservation management

## Supabase setup

Apply SQL schema:

- `supabase/physical-delivery-schema.sql`

Deploy edge functions:

- `send-order-notification`
- `process-physical-batch`

Required env vars (Supabase project + edge runtime):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (for order emails)

## Local development

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run lint
npm run build
```
