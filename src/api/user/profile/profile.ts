import { profilesUpdateResponse } from "../../../interface/Profile";
import Api from "../../Api";

const ProfileService = {
    // Get user profile by userId
    getProfile: (profileId: number) => {
        return Api.get(`/user/profile/${profileId}`);
    },

    // Get current user's profile
    getMe: () => {
        return Api.get('/user/profile/me');
    },

    update: (profileId: number, data: FormData) => {
        return Api.patch(`/user/profile/${profileId}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default ProfileService;
