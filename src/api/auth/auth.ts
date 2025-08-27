import api from "../Api";

async function Login(email: string, password: string) {
    return await api.post("/auth/login", {
        email,
        password
    })
}

async function Signup(email: string, password: string) {
    return await api.post("/auth/signup", {
        email,
        password
    })
}

async function Logout() {
    return await api.post("/auth/logout");
}

async function VerifyToken() {
    return await api.get("/auth/verify");
}

const AuthServer = {
    Login,
    Signup,
    Logout,
    VerifyToken
}

export default AuthServer;