// Profile data interface for user profile pages

export interface ProfileData {
    userId: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    imagePath?: string;
    user?: {
        id: number;
        email: string;
    };
}
