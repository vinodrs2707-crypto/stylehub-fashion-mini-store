import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { formatPrice } from "../utils";

export default function Cart() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);

    const loadCart = useCallback(async () => {
        try {
            setCart(await api("/cart"));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    async function changeQuantity(item, newQuantity) {
        if (newQuantity < 1) return;
        setError("");
        setBusyId(item.id);
        try {
            setCart(
                await api(`/cart/items/${item.id}`, {
                    method: "PUT",
                    body: { quantity: newQuantity },
                })
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function removeItem(item) {
        setError("");
        setBusyId(item.id);
        try {
            setCart(await api(`/cart/items/${item.id}`, { method: "DELETE" }));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    if (loading) {
        return <p className="center-text">Loading your cart...</p>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="card center-text">
                <h2>Your cart is empty</h2>
                {error && <p className="error">{error}</p>}
                <Link className="btn" to="/">
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h2>Your Cart</h2>
            {error && <p className="error">{error}</p>}

            <div className="card">
                {cart.items.map((item) => (
                    <div className="cart-row" key={item.id}>
                        <img src={item.product.image_url} alt={item.product.name} />
                        <div className="cart-info">
                            <h3>{item.product.name}</h3>
                            <p className="muted">{formatPrice(item.product.price_cents)} each</p>
                        </div>
                        <div className="row">
                            <button
                                className="btn btn-small"
                                disabled={busyId === item.id || item.quantity <= 1}
                                onClick={() => changeQuantity(item, item.quantity - 1)}
                            >
                                -
                            </button>
                            <span className="qty">{item.quantity}</span>
                            <button
                                className="btn btn-small"
                                disabled={busyId === item.id}
                                onClick={() => changeQuantity(item, item.quantity + 1)}
                            >
                                +
                            </button>
                        </div>
                        <p className="line-total">{formatPrice(item.line_total_cents)}</p>
                        <button
                            className="btn btn-small btn-danger"
                            disabled={busyId === item.id}
                            onClick={() => removeItem(item)}
                        >
                            Remove
                        </button>
                    </div>
                ))}

                <div className="cart-total">
                    <p>
                        Items: <strong>{cart.total_items}</strong>
                    </p>
                    <p>
                        Total: <strong>{formatPrice(cart.total_cents)}</strong>
                    </p>
                    <Link className="btn" to="/checkout">
                        Proceed to checkout
                    </Link>
                </div>
            </div>
        </div>
    );
}