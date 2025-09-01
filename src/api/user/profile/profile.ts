import Api from "../../Api";

const ProfileService = {
    // Get user profile by userId
    getProfile: (profileId: number) => {
        return Api.get(`/user/profile/${profileId}`);
    },

    // Get current user's profile
    getMe: () => {
        return Api.get('/user/profile/me');
    }
};

export default ProfileService;
