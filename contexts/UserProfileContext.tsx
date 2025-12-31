import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
    firstName: string;
    lastName: string;
    phone: string;
    bio: string;
    title: string; // e.g., "Math & Physics Expert"
    subjects: string[];
}

interface UserProfileContextType {
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => void;
    addSubject: (subject: string) => void;
    removeSubject: (subject: string) => void;
}

const defaultProfile: UserProfile = {
    firstName: 'Alex',
    lastName: 'Taylor',
    phone: '+1 (555) 000-0000',
    bio: 'Senior math and physics tutor with over 5 years of experience helping high school and college students excel in their studies.',
    title: 'Math & Physics Expert',
    subjects: ['Algebra II', 'Physics', 'Calculus', 'Geometry', 'Chemistry'],
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile>(defaultProfile);

    // Load profile from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('tutorly_userProfile');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setProfile({ ...defaultProfile, ...parsed });
            } catch (e) {
                console.error('Failed to parse stored profile:', e);
            }
        }
    }, []);

    const updateProfile = (updates: Partial<UserProfile>) => {
        const newProfile = { ...profile, ...updates };
        setProfile(newProfile);
        // Save to localStorage
        localStorage.setItem('tutorly_userProfile', JSON.stringify(newProfile));
    };

    const addSubject = (subject: string) => {
        if (subject.trim() && !profile.subjects.includes(subject.trim())) {
            const newSubjects = [...profile.subjects, subject.trim()];
            updateProfile({ subjects: newSubjects });
        }
    };

    const removeSubject = (subject: string) => {
        const newSubjects = profile.subjects.filter(s => s !== subject);
        updateProfile({ subjects: newSubjects });
    };

    return (
        <UserProfileContext.Provider value={{ profile, updateProfile, addSubject, removeSubject }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

