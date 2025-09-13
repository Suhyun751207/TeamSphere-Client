import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileService from "../../../api/user/profile/profile";
import { profilesUpdateResponse } from "../../../interface/Profile";
import "./profileEdit.css";

export default function ProfileEdit() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<profilesUpdateResponse>({
        name: "",
        age: null,
        gender: "UNSPECIFIED",
        phone: null,
        imagePath: null
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await (userId 
                    ? ProfileService.getProfile(Number(userId))
                    : ProfileService.getMe());
                setProfile(response.data);
                if (response.data.imagePath) {
                    setPreviewUrl(response.data.imagePath);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.entries(profile).forEach(([key, value]) => {
                if (value !== null) {
                    formData.append(key, value.toString());
                }
            });
            if (imageFile) {
                formData.append('image', imageFile);
            }
            const data = await ProfileService.getMe();
            const profileId = data.data.user.id;
            if (isNaN(profileId)) {
                throw new Error('Invalid profile ID');
            }

            await ProfileService.update(profileId, formData);
            
            // Navigate back to profile page
            navigate('/user/profile');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="profile-edit-container">
            <form onSubmit={handleSubmit} className="profile-edit-form">
                <div className="image-upload-section">
                    <div className="profile-image-preview">
                        {previewUrl && (
                            <img src={previewUrl} alt="Profile preview" />
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="image-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="age">Age</label>
                    <input
                        type="number"
                        id="age"
                        name="age"
                        value={profile.age || ''}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                        id="gender"
                        name="gender"
                        value={profile.gender}
                        onChange={handleInputChange}
                    >
                        <option value="UNSPECIFIED">Unspecified</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="PRIVATE">Private</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profile.phone || ''}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="button-group">
                    <button type="submit" className="submit-button">
                        Save Changes
                    </button>
                    <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}