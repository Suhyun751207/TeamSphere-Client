import { useEffect, useState } from "react";
import ProfileServer from "../../api/user/Profile";

function Profile() {
    const [mergedData, setMergedData] = useState<any[]>([]);

    useEffect(() => {
        ProfileServer.ProfileAllGet().then((res) => {
            const { profile, user } = res.data;

            // profile.userId 와 user.id 매칭
            const combined = profile.map((p: any) => {
                const matchedUser = user.find((u: any) => u.id === p.userId);
                return {
                    ...p,
                    user: matchedUser,
                };
            });

            setMergedData(combined);
        });
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ marginBottom: "16px" }}>Profile</h1>
            <div style={{ display: "grid", gap: "12px" }}>
                {mergedData.map((item) => (
                    <div
                        key={item.userId}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            background: "#fafafa",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                            {item.name}
                        </h2>
                        <p style={{ margin: "4px 0" }}>나이: {item.age}</p>
                        <p style={{ margin: "4px 0" }}>전화번호: {item.phone}</p>
                        <p style={{ margin: "4px 0", color: "#555" }}>
                            이메일: {item.user?.email}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Profile;
