import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api";
import { formatPrice } from "../utils";

function formatDate(value) {
    const hasZone = /Z$|[+-]\d\d:\d\d$/.test(value);
    return new Date(hasZone ? value : `${value}Z`).toLocaleString();
}

export default function Orders() {
    const location = useLocation();
    const paidOrderId = location.state?.paidOrderId;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        let attempts = 0;
        let timer;

        async function load() {
            try {
                const data = await api("/orders");
                if (cancelled) return;
                setOrders(data);
                setLoading(false);

                const justPaid = data.find((order) => order.id === paidOrderId);
                if (justPaid && justPaid.status === "pending" && attempts < 10) {
                    attempts += 1;
                    timer = setTimeout(load, 1500);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [paidOrderId]);

    if (loading) {
        return <p className="center-text">Loading your orders...</p>;
    }

    const justPaid = orders.find((order) => order.id === paidOrderId);

    return (
        <div>
            <h2>My Orders</h2>

            {justPaid && justPaid.status === "paid" && (
                <p className="success">
                    Payment successful! Thank you for your order #{justPaid.id}.
                </p>
            )}
            {justPaid && justPaid.status === "pending" && (
                <p className="success">
                    Payment received. We are confirming your order #{justPaid.id}...
                </p>
            )}
            {error && <p className="error">{error}</p>}

            {orders.length === 0 ? (
                <div className="card center-text">
                    <p>You have no orders yet.</p>
                    <Link className="btn" to="/">
                        Start shopping
                    </Link>
                </div>
            ) : (
                orders.map((order) => (
                    <div className="card order-card" key={order.id}>
                        <div className="order-head">
                            <div>
                                <h3>Order #{order.id}</h3>
                                <p className="muted">{formatDate(order.created_at)}</p>
                            </div>
                            <span className={`status status-${order.status}`}>
                                {order.status}
                            </span>
                        </div>

                        <ul className="order-items">
                            {order.items.map((item) => (
                                <li key={item.id}>
                                    {item.product_name} x {item.quantity}
                                    <span>{formatPrice(item.unit_price_cents * item.quantity)}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="order-total">
                            Total: <strong>{formatPrice(order.total_cents)}</strong>
                        </p>
                    </div>
                ))
            )}
        </div>
    );
}