import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { api } from "../api";
import { formatPrice } from "../utils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ orderId }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!stripe || !elements) return;

        setError("");
        setPaying(true);

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/orders` },
            redirect: "if_required",
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed. Please try again.");
            setPaying(false);
            return;
        }

        navigate("/orders", { state: { paidOrderId: orderId } });
    }

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && <p className="error">{error}</p>}
            <button className="btn" type="submit" disabled={!stripe || paying}>
                {paying ? "Processing payment..." : "Pay now"}
            </button>
        </form>
    );
}

export default function Checkout() {
    const [checkout, setCheckout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        api("/orders/checkout", { method: "POST" })
            .then(setCheckout)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="center-text">Preparing your secure checkout...</p>;
    }

    if (!checkout) {
        return (
            <div className="card">
                <p className="error">{error || "Could not start checkout"}</p>
                <Link to="/cart">Back to cart</Link>
            </div>
        );
    }

    return (
        <div className="card form-card">
            <h2>Checkout</h2>
            <p>Order #{checkout.order_id}</p>
            <p>
                Total to pay: <strong>{formatPrice(checkout.total_cents)}</strong>
            </p>
            <p className="muted">
                Test mode: use card 4242 4242 4242 4242, any future expiry date and any
                CVC.
            </p>
            <Elements
                stripe={stripePromise}
                options={{ clientSecret: checkout.client_secret }}
            >
                <PaymentForm orderId={checkout.order_id} />
            </Elements>
        </div>
    );
}