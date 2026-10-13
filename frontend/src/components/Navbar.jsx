import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <header className="navbar">
            <Link to="/" className="brand">
                StyleHub
            </Link>
            <nav>
                <NavLink to="/" end>
                    Products
                </NavLink>
                {user ? (
                    <>
                        <NavLink to="/cart">Cart</NavLink>
                        <NavLink to="/orders">My Orders</NavLink>
                        <span className="nav-user">{user.full_name}</span>
                        <button className="btn btn-small" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink to="/login">Login</NavLink>
                        <NavLink to="/register">Register</NavLink>
                    </>
                )}
            </nav>
        </header>
    );
}