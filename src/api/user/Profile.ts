import { profilesCreate, profilesUpdate } from "../../interface/Profile";
import api from "../Api";

async function ProfileAllGet() {
    return await api.get("/user/profile")
}

async function ProfileCreate(data: profilesCreate) {
    return await api.post("/user/profile", data)
}

async function ProfileUserGet(userId: number) {
    return await api.get(`/user/profile/${userId}`)
}

async function ProfileUserUpdate(userId: number, data: profilesUpdate) {
    return await api.patch(`/user/profile/${userId}`, data)
}

const ProfileServer = {
    ProfileAllGet,
    ProfileCreate,
    ProfileUserGet,
    ProfileUserUpdate
}

export default ProfileServer;