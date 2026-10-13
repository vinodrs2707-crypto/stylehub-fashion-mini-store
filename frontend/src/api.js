const API_URL = import.meta.env.VITE_API_URL;

export function getToken() {
    return localStorage.getItem("token");
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function clearToken() {
    localStorage.removeItem("token");
}

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

function getErrorMessage(data) {
    if (!data || !data.detail) return "Something went wrong";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
        return data.detail.map((e) => e.msg).join(", ");
    }
    return "Something went wrong";
}

export async function api(path, { method = "GET", body } = {}) {
    const headers = {};
    const token = getToken();

    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error("Cannot reach the server. Is the API running?");
    }

    if (response.status === 401 && token) {
        clearToken();
        if (onUnauthorized) onUnauthorized();
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(getErrorMessage(data));
    }

    return data;
}