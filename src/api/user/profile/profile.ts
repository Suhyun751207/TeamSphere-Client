import { profilesUpdateResponse } from "../../../interface/Profile";
import Api from "../../Api";

const ProfileService = {
    // Get user profile by userId
    getProfile: (profileId: number) => {
        return Api.get(`/v1/user/profile/${profileId}`);
    },

    // Get current user's profile
    getMe: () => {
        return Api.get('/v1/user/profile/me');
    },

    create: (profileId: number, data: FormData) => {
        return Api.post(`/v1/user/profile/${profileId}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    update: (profileId: number, data: FormData) => {
        return Api.patch(`/v1/user/profile/${profileId}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default ProfileService;
