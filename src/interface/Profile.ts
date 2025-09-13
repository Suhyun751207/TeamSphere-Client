export interface profiles {
    userId: number;
    name: string;
    age: number | null;
    gender: ['FEMALE', 'MALE', 'PRIVATE', 'UNSPECIFIED'];
    phone: string | null;
    imagePath: string | null;
    subscriptionState: ['Free', 'Pro', 'Team', 'Admin'];
    createdAt: Date;
    updatedAt: Date;
}



export type profilesAutoSetKeys = "userId" | "createdAt" | "updatedAt" | "subscriptionState"
export interface profilesCreate extends Omit<profiles, profilesAutoSetKeys> { };
export interface profilesUpdate extends Partial<profilesCreate> { }; 


export type Gender = 'FEMALE' | 'MALE' | 'PRIVATE' | 'UNSPECIFIED';

export interface profilesUpdateResponse {
    userId?: number;
    name: string;
    age: number | null;
    gender: Gender;
    phone: string | null;
    imagePath: string | null;
}
