import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { formatPrice } from "../utils";

export default function ProductDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        api(`/products/${id}`)
            .then(setProduct)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleAdd() {
        if (!user) {
            navigate("/login", { state: { from: `/products/${id}` } });
            return;
        }

        setMessage("");
        setError("");
        setAdding(true);
        try {
            await api("/cart/items", {
                method: "POST",
                body: { product_id: product.id, quantity },
            });
            setMessage(`Added ${quantity} to your cart.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    }

    if (loading) {
        return <p className="center-text">Loading...</p>;
    }

    if (!product) {
        return (
            <div className="card">
                <p className="error">{error || "Product not found"}</p>
                <Link to="/">Back to products</Link>
            </div>
        );
    }

    return (
        <div>
            <Link to="/">&larr; Back to products</Link>
            <div className="card detail">
                <img src={product.image_url} alt={product.name} />
                <div className="detail-info">
                    <span className="tag">{product.category}</span>
                    <h2>{product.name}</h2>
                    <p className="price">{formatPrice(product.price_cents)}</p>
                    <p>{product.description}</p>
                    <p className="muted">
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </p>

                    {message && <p className="success">{message}</p>}
                    {error && <p className="error">{error}</p>}

                    <div className="row">
                        <input
                            type="number"
                            min={1}
                            max={Math.max(1, Math.min(99, product.stock))}
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Math.max(1, Number(e.target.value) || 1))
                            }
                        />
                        <button
                            className="btn"
                            disabled={product.stock === 0 || adding}
                            onClick={handleAdd}
                        >
                            {adding ? "Adding..." : "Add to cart"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}