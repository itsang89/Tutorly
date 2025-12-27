import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student } from '../types';

interface StudentsContextType {
    students: Student[];
    addStudent: (student: Student) => void;
    updateStudent: (id: string, updates: Partial<Student>) => void;
    removeStudent: (id: string) => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize state from localStorage immediately
    const [students, setStudents] = useState<Student[]>(() => {
        const stored = localStorage.getItem('tutorly_students');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored students:', e);
                return [];
            }
        }
        return [];
    });

    // Load students from localStorage on mount (in case it changed externally)
    useEffect(() => {
        const stored = localStorage.getItem('tutorly_students');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setStudents(parsed);
            } catch (e) {
                console.error('Failed to parse stored students:', e);
            }
        }
    }, []);

    // Save students to localStorage whenever they change (but skip initial empty array)
    useEffect(() => {
        if (students.length > 0 || localStorage.getItem('tutorly_students')) {
            localStorage.setItem('tutorly_students', JSON.stringify(students));
        }
    }, [students]);

    const addStudent = (student: Student) => {
        setStudents(prev => [...prev, student]);
    };

    const updateStudent = (id: string, updates: Partial<Student>) => {
        setStudents(prev => prev.map(s => 
            s.id === id ? { ...s, ...updates } : s
        ));
    };

    const removeStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    return (
        <StudentsContext.Provider value={{ students, addStudent, updateStudent, removeStudent }}>
            {children}
        </StudentsContext.Provider>
    );
};

export const useStudents = () => {
    const context = useContext(StudentsContext);
    if (context === undefined) {
        throw new Error('useStudents must be used within a StudentsProvider');
    }
    return context;
};

