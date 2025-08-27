import { useState } from "react";
import AuthServer from "../../api/auth/auth";
import { useNavigate } from "react-router-dom";

function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const SignupButton = async () => {
        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }
        try{
            await AuthServer.Signup(email, password);
            navigate("/auth/login");
        }catch(e){
            console.log(e);
        }
        
    }

    return (
        <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={SignupButton}>Signup</button>
        </div>
    )
}

export default Signup;
