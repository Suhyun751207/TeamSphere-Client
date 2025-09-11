import { useState } from "react";
import AuthServer from "../../api/auth/auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";
import logo from "../../images/iconTitle.png";

function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const SignupButton = async () => {
        if (!username || !email || !password || !confirmPassword) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        if (password !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }
        try{
            await AuthServer.Signup(email, password);
            navigate("/auth/login");
        }catch(e){
            console.log(e);
        }
    }

    const isPasswordMatch = password === confirmPassword;
    const isFormValid = username && email && password && confirmPassword && isPasswordMatch;

    return (
        <div className={styles.authContainer}>
            <div className={styles.leftSection}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <img src={logo} alt="TeamSphere logo" />
                        <h1 className={styles.formTitle}>Create Account</h1>
                        <p className={styles.formSubtitle}>Join TeamSphere and start collaborating</p>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); SignupButton(); }}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username" className={styles.label}>Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        
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

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`${styles.input} ${confirmPassword && !isPasswordMatch ? styles.inputError : ''}`}
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <i className="fas fa-eye-slash" /> : <i className="fas fa-eye" />}
                                </button>
                            </div>
                            {confirmPassword && !isPasswordMatch && (
                                <div className={styles.errorMessage}>
                                    비밀번호가 일치하지 않습니다.
                                </div>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
                            disabled={!isFormValid}
                        >
                            Create Account
                        </button>
                    </form>
                    
                    <p className={styles.linkText}>
                        Already have an account? <Link to="/auth/login">Log in</Link>
                    </p>
                </div>
            </div>
            
            <div className={styles.rightSection}>
                <div className={styles.tagline}>
                    Welcome to <span className={styles.taglineHighlight}>TeamSphere</span>
                    <br />
                    Where collaboration meets innovation
                </div>
            </div>
        </div>
    )
}

export default Signup;
