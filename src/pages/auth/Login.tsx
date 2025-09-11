import { useState } from "react";
import AuthServer from "../../api/auth/auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";
import logo from "../../images/iconTitle.png";


function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const LoginButton = async () => {
        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }
        try {
            await AuthServer.Login(email, password);
            navigate("/");
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.leftSection}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <img src={logo} alt="TeamSphere logo" />
                        <h1 className={styles.formTitle}>Welcome Back</h1>
                        <p className={styles.formSubtitle}>Sign in to your TeamSphere account</p>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); LoginButton(); }}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <i className="fas fa-eye-slash" /> : <i className="fas fa-eye" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            Sign In
                        </button>
                    </form>

                    <p className={styles.linkText}>
                        Don't have an account? <Link to="/auth/signup">Create one</Link>
                    </p>
                </div>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.tagline}>
                    Continue your journey with <span className={styles.taglineHighlight}>TeamSphere</span>
                    <br />
                    Seamless collaboration awaits
                </div>
            </div>
        </div>
    )
}

export default Login;
