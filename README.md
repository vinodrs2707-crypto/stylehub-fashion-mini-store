# StyleHub – Fashion Mini Store

A full-stack fashion mini store. Users can register, log in, browse products, add items to a cart and pay with Stripe (test mode).

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy (ORM), SQLite
- **Frontend:** React (Vite), React Router
- **Authentication:** JWT, bcrypt password hashing
- **Payments:** Stripe PaymentIntents, Stripe Elements, webhook (test mode only)

## Features

- User registration and login with JWT, bcrypt password hashing, protected routes
- Products API: list all products and view a single product
- Cart: add, update quantity, remove, total price, separate cart for each user, stock checks
- Orders: order and order items saved with the price at purchase time
- Stripe payment intent, success and failure handled by a signed webhook
- Order history page with a status badge (pending, paid, failed)
- Validation and error handling on the API and in the forms

## Project Structure

```
stylehub/
  .env.example           settings template (backend)
  backend/
    seed.py              adds sample products
    requirements.txt
    app/
      main.py            app, CORS, routers
      config.py          settings from .env
      database.py        engine and session
      models.py          User, Product, CartItem, Order, OrderItem
      schemas.py         request and response models
      security.py        password hashing and JWT
      dependencies.py    get_current_user
      routers/           auth, products, cart, orders, webhooks
  frontend/
    .env.example         settings template (frontend)
    src/
      api.js             API helper (adds the token, handles errors)
      AuthContext.jsx    login state
      components/        Navbar, ProtectedRoute
      pages/             Register, Login, Products, ProductDetail, Cart, Checkout, Orders
```

## Setup (Windows)

You need Python 3.11+, Node.js, and a free Stripe account in test mode.

### 1. Settings files

1. Copy `.env.example` to `.env` in the project root and fill in your own values:
   - `SECRET_KEY`: any long random string
   - `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`: your Stripe **test** keys (Developers, API keys)
   - `STRIPE_WEBHOOK_SECRET`: printed by the Stripe CLI in step 4
2. Copy `frontend/.env.example` to `frontend/.env` and fill in your publishable key.

The backend refuses to start if the Stripe secret key is not a test key (`sk_test_...`).

### 2. Backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000 and the interactive docs are at http://127.0.0.1:8000/docs

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 4. Stripe webhook (needed to mark orders as paid)

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then run:

```
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to localhost:8000/webhooks/stripe
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the backend.

## Testing a Payment

Use Stripe's test card: `4242 4242 4242 4242`, any future expiry date, any CVC. No real money is used.

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Create an account |
| POST | /auth/login | No | Log in, returns a JWT |
| GET | /auth/me | Yes | Current user |
| GET | /products | No | List products |
| GET | /products/{id} | No | Single product |
| GET | /cart | Yes | View cart with total |
| POST | /cart/items | Yes | Add to cart |
| PUT | /cart/items/{id} | Yes | Update quantity |
| DELETE | /cart/items/{id} | Yes | Remove from cart |
| POST | /orders/checkout | Yes | Create order and Stripe payment |
| GET | /orders | Yes | Order history |
| GET | /orders/{id} | Yes | Single order |
| POST | /webhooks/stripe | Stripe signature | Updates order status |

## Security Notes

- Passwords are hashed with bcrypt and never stored or returned in plain text
- JWT tokens expire after 60 minutes
- Stripe keys and the JWT secret are read from environment variables and are not committed
- All database access goes through the SQLAlchemy ORM (no raw SQL)
- Card details are entered in Stripe Elements and never reach this server
- Webhook requests are verified with Stripe's signature
- Prices are stored in cents; order items keep the price paid at purchase time