import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { formatPrice } from "../utils";

export default function Products() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [addingId, setAddingId] = useState(null);

    useEffect(() => {
        api("/products")
            .then(setProducts)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    async function handleAdd(product) {
        if (!user) {
            navigate("/login", { state: { from: "/" } });
            return;
        }

        setMessage("");
        setError("");
        setAddingId(product.id);
        try {
            await api("/cart/items", {
                method: "POST",
                body: { product_id: product.id, quantity: 1 },
            });
            setMessage(`${product.name} was added to your cart.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setAddingId(null);
        }
    }

    if (loading) {
        return <p className="center-text">Loading products...</p>;
    }

    return (
        <div>
            <h2>Our Collection</h2>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <div className="grid">
                {products.map((product) => (
                    <div className="card product-card" key={product.id}>
                        <Link to={`/products/${product.id}`}>
                            <img src={product.image_url} alt={product.name} />
                        </Link>
                        <span className="tag">{product.category}</span>
                        <h3>
                            <Link to={`/products/${product.id}`}>{product.name}</Link>
                        </h3>
                        <p className="price">{formatPrice(product.price_cents)}</p>
                        <p className="muted">
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                        </p>
                        <button
                            className="btn"
                            disabled={product.stock === 0 || addingId === product.id}
                            onClick={() => handleAdd(product)}
                        >
                            {addingId === product.id ? "Adding..." : "Add to cart"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}