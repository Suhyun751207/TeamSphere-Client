import { profilesCreate, profilesUpdate } from "../../interface/Profile";
import api from "../Api";

async function ProfileAllGet() {
    return await api.get("/v1/user/profile")
}

async function ProfileCreate(data: profilesCreate) {
    return await api.post("/v1/user/profile", data)
}

async function ProfileUserGet(userId: number) {
    return await api.get(`/v1/user/profile/${userId}`)
}

async function ProfileUserUpdate(userId: number, data: profilesUpdate) {
    return await api.patch(`/v1/user/profile/${userId}`, data)
}

async function getToken() {
    return await api.get("/v1/user/token")
}

async function getMe() {
    return await api.get("/v1/user/profile/me")
}

const ProfileServer = {
    ProfileAllGet,
    ProfileCreate,
    ProfileUserGet,
    ProfileUserUpdate,
    getMe,
    getToken
}

export default ProfileServer;