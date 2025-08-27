import api from "../Api";

async function ChangePassword(password: string, newPassword: string) {
    return await api.patch("/user/", {
        password,
        newPassword
    })
}

async function ChangeNotLoginPassword(email:string, password: string, newPassword: string) {
    return await api.patch("/user/notlogin", {
        email,
        password,
        newPassword
    })
}

const PasswordServer = {
    ChangePassword,
    ChangeNotLoginPassword
}

export default PasswordServer;