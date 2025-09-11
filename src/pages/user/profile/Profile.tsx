import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileServer from "../../../api/user/Profile";
import ProfileService from "../../../api/user/profile/profile";
import { ProfileData } from "../../../interface/ProfileData";
import "./Profile.css";

function Profile() {
    const [mergedData, setMergedData] = useState<ProfileData[]>([]);
    const [currentUser, setCurrentUser] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            
            // 현재 사용자 정보 로드
            const currentUserResponse = await ProfileService.getMe();
            setCurrentUser({
                userId: currentUserResponse.data.user.id,
                name: currentUserResponse.data.profile.name,
                age: currentUserResponse.data.profile.age,
                gender: currentUserResponse.data.profile.gender,
                phone: currentUserResponse.data.profile.phone,
                imagePath: currentUserResponse.data.profile.imagePath,
                user: currentUserResponse.data.user
            });

            // 모든 사용자 프로필 로드
            const allProfilesResponse = await ProfileServer.ProfileAllGet();
            const { profile, user } = allProfilesResponse.data;

            const combined = profile.map((p: any) => {
                const matchedUser = user.find((u: any) => u.id === p.userId);
                return {
                    ...p,
                    user: matchedUser,
                };
            });

            setMergedData(combined);
        } catch (error) {
            console.error("프로필 데이터 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="profile-loading">로딩 중...</div>;
    }

    return (
        <div className="profile-container">
            {/* Header */}
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/" className="back-button">
                        ← 대시보드로 돌아가기
                    </Link>
                    <h1>프로필 관리</h1>
                </div>
            </header>

            {/* Current User Profile */}
            {currentUser && (
                <section className="current-user-section">
                    <h2>내 프로필</h2>
                    <div className="profile-card current-user">
                        <div className="profile-avatar">
                            {currentUser.imagePath ? (
                                <img src={currentUser.imagePath} alt="프로필" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {currentUser.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                        <div className="profile-info">
                            <h3>{currentUser.name}</h3>
                            <div className="profile-details">
                                <div className="detail-item">
                                    <span className="label">이메일</span>
                                    <span className="value">{currentUser.user?.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">나이</span>
                                    <span className="value">{currentUser.age}세</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">성별</span>
                                    <span className="value">{currentUser.gender}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">전화번호</span>
                                    <span className="value">{currentUser.phone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="profile-actions">
                            <button className="edit-button">프로필 수정</button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Profile;
