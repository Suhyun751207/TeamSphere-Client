import api from "../Api";

async function Login(email: string, password: string) {
    return await api.post("/v1/auth/login", {
        email,
        password
    })
}

async function Signup(email: string, password: string) {
    return await api.post("/v1/auth/signup", {
        email,
        password
    })
}

async function Logout() {
    return await api.get("/v1/auth/logout");
}

const AuthServer = {
    Login,
    Signup,
    Logout
}

export default AuthServer;