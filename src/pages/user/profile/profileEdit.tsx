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
    
    // 전화번호 분리 상태
    const [phoneParts, setPhoneParts] = useState({
        part1: "",
        part2: "",
        part3: ""
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await ProfileService.getMe();
                if (response.data.profile == null) {
                    return;
                }
                const { profile: userProfile } = response.data;

                setProfile({
                    name: userProfile.name,
                    age: userProfile.age,
                    gender: userProfile.gender,
                    phone: userProfile.phone,
                    imagePath: userProfile.imagePath
                });

                // 전화번호 분리
                if (userProfile.phone) {
                    const phoneParts = userProfile.phone.split('-');
                    if (phoneParts.length === 3) {
                        setPhoneParts({
                            part1: phoneParts[0],
                            part2: phoneParts[1],
                            part3: phoneParts[2]
                        });
                    }
                }

                if (userProfile.imagePath) {
                    setPreviewUrl(userProfile.imagePath);
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'age') {
            // 나이는 최대 99까지 제한
            const ageValue = parseInt(value);
            if (value === '' || (ageValue >= 0 && ageValue <= 99)) {
                setProfile(prev => ({
                    ...prev,
                    [name]: value === '' ? null : ageValue
                }));
            }
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handlePhoneChange = (part: 'part1' | 'part2' | 'part3', value: string) => {
        // 숫자만 허용
        const numericValue = value.replace(/[^0-9]/g, '');
        
        // 각 부분의 최대 길이 제한
        let maxLength = 4;
        if (part === 'part1') {
            maxLength = 4; // 010, 02, 031 등
        } else if (part === 'part2') {
            maxLength = 4; // 최대 4자리
        } else if (part === 'part3') {
            maxLength = 4; // 최대 4자리
        }
        
        const truncatedValue = numericValue.slice(0, maxLength);
        
        setPhoneParts(prev => ({
            ...prev,
            [part]: truncatedValue
        }));
        
        // 전화번호 병합하여 profile 상태 업데이트
        const { part1, part2, part3 } = phoneParts;
        const updatedParts = { ...phoneParts, [part]: truncatedValue };
        
        if (updatedParts.part1 && updatedParts.part2 && updatedParts.part3) {
            const fullPhone = `${updatedParts.part1}-${updatedParts.part2}-${updatedParts.part3}`;
            setProfile(prev => ({
                ...prev,
                phone: fullPhone
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                phone: null
            }));
        }
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
            if (data.data.profile == null) {
                await ProfileService.create(profileId, formData);
            } else {
                await ProfileService.update(profileId, formData);
            }

            // Navigate back to profile page
            navigate('/');
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
                        min="0"
                        max="99"
                        placeholder="0-99"
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
                    <div className="phone-input-group">
                        <input
                            type="text"
                            className="phone-input"
                            value={phoneParts.part1}
                            onChange={(e) => handlePhoneChange('part1', e.target.value)}
                            placeholder="010"
                            maxLength={4}
                        />
                        <span className="phone-separator">-</span>
                        <input
                            type="text"
                            className="phone-input"
                            value={phoneParts.part2}
                            onChange={(e) => handlePhoneChange('part2', e.target.value)}
                            placeholder="1234"
                            maxLength={4}
                        />
                        <span className="phone-separator">-</span>
                        <input
                            type="text"
                            className="phone-input"
                            value={phoneParts.part3}
                            onChange={(e) => handlePhoneChange('part3', e.target.value)}
                            placeholder="5678"
                            maxLength={4}
                        />
                    </div>
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