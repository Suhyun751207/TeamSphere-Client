export interface User {
    id: number;
    email: string;
}

export interface Profile {
    id: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    imagePath?: string;
}

export interface UserProfileResponse {
    user: User;
    profile: Profile;
}
