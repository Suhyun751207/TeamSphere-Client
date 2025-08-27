import { useState } from "react";
import AuthServer from "../../api/auth/auth";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const LoginButton = async () => {
        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }
        try{
            await AuthServer.Login(email, password);
            navigate("/");
        }catch(e){
            console.log(e);
        }
        
    }

    return (
        <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={LoginButton}>Login</button>
        </div>
    )
}

export default Login;
