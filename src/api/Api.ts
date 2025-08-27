import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:8080/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    },
});

export default api;
