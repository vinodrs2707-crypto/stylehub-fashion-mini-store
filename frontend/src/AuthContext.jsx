import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    api,
    clearToken,
    getToken,
    setToken,
    setUnauthorizedHandler,
} from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(getToken()));

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(logout);

        if (!getToken()) return;

        api("/auth/me")
            .then(setUser)
            .catch(() => logout())
            .finally(() => setLoading(false));
    }, [logout]);

    async function login(email, password) {
        const data = await api("/auth/login", {
            method: "POST",
            body: { email, password },
        });
        setToken(data.access_token);
        const me = await api("/auth/me");
        setUser(me);
    }

    async function register(fullName, email, password) {
        await api("/auth/register", {
            method: "POST",
            body: { full_name: fullName, email, password },
        });
        await login(email, password);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}