# Questpay Payment Integration Demo

A simple full-stack demo showing Questpay hosted checkout, JWT auth (email-only), webhooks, and wallet balance tracking.

## Prerequisites

- [Bun](https://bun.sh) or Node.js 18+
- MongoDB running locally or a remote connection string
- Questpay API key (`qp_live_sk_...`)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI, QUESTPAY_API_KEY, and JWT_SECRET
bun install
bun dev
```

Server runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
cp .env.sample .env
bun install
bun dev
```

App runs at `http://localhost:3000`.

## Environment variables

**Backend** (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `QUESTPAY_API_KEY` | Questpay secret API key |
| `QUESTPAY_BASE_URL` | `https://payments-server.questlabs.cc/api` |
| `QUESTPAY_WEBHOOK_PATH` | `/webhooks/questpay` |
| `CLIENT_URL` | `http://localhost:3000` (checkout return URL) |
| `JWT_SECRET` | Secret for signing auth tokens |

**Frontend** (`frontend/.env`):

| Variable | Description |
|----------|-------------|
| `VITE_BASE_URL` | `http://localhost:8000/api` |

## Webhook testing

Questpay must reach your backend webhook endpoint. For local development, use a tunnel (e.g. ngrok):

```bash
ngrok http 8000
```

Paste the public URL + webhook path into Questpay Settings → Webhook URL:

```
https://your-ngrok-url.ngrok.io/webhooks/questpay
```

## Demo flow

1. **Sign up** at `/signup` with your email
2. **Log in** at `/login` if you already have an account
3. On the **wallet** page (`/`), enter an amount and click **Pay Now**
4. Complete payment on Questpay hosted checkout
5. You are redirected to `/payment/callback` — the page polls until payment is confirmed
6. Return to the wallet — balance updates after the webhook credits your account
7. View history at `/transactions`

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account (email only) |
| POST | `/api/auth/login` | No | Log in (email only) |
| GET | `/api/auth/me` | Yes | Get current user + balance |
| POST | `/api/payments/initiate` | Yes | Start Questpay checkout |
| GET | `/api/payments/verify/:reference` | No | Check payment status |
| GET | `/api/transactions` | Yes | List user transactions |
| POST | `/webhooks/questpay` | Signature | Questpay webhook (HMAC verified) |
