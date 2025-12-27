import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ScheduleItem, Student } from '../types';
import { useStudents } from './StudentsContext';

interface ScheduleContextType {
    scheduleItems: ScheduleItem[];
    recurringItems: ScheduleItem[]; // Generated from student weekly schedules
    allScheduleItems: ScheduleItem[]; // Combined scheduleItems + recurringItems
    addScheduleItem: (item: ScheduleItem) => void;
    removeScheduleItem: (id: string) => void;
    updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { students } = useStudents();
    // Initialize state from localStorage immediately
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(() => {
        const stored = localStorage.getItem('tutorly_scheduleItems');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored schedule items:', e);
                return [];
            }
        }
        return [];
    });
    const [currentDate, setCurrentDate] = useState(new Date());

    // Generate recurring schedule items from students' weekly schedules
    const recurringItems = useMemo(() => {
        const items: ScheduleItem[] = [];
        
        students.forEach(student => {
            if (student.weeklySchedule && student.weeklySchedule.length > 0 && student.status === 'Active') {
                student.weeklySchedule.forEach((slot, index) => {
                    const item: ScheduleItem = {
                        id: `recurring-${student.id}-${slot.day}-${index}`,
                        title: student.name,
                        subtitle: student.subject,
                        day: slot.day,
                        startTime: slot.startTime,
                        duration: slot.duration,
                        color: (student.color as 'amber' | 'blue' | 'stone' | 'accent') || 'stone',
                        isGroup: false,
                        studentId: student.id, // Store student ID for price lookup
                    };
                    items.push(item);
                });
            }
        });
        
        return items;
    }, [students]);

    // Combine manual schedule items with recurring items
    const allScheduleItems = useMemo(() => {
        return [...scheduleItems, ...recurringItems];
    }, [scheduleItems, recurringItems]);

    // Load schedule items from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('tutorly_scheduleItems');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setScheduleItems(parsed);
            } catch (e) {
                console.error('Failed to parse stored schedule items:', e);
            }
        }
    }, []);

    // Save schedule items to localStorage whenever they change (but skip initial empty array)
    useEffect(() => {
        if (scheduleItems.length > 0 || localStorage.getItem('tutorly_scheduleItems')) {
            localStorage.setItem('tutorly_scheduleItems', JSON.stringify(scheduleItems));
        }
    }, [scheduleItems]);

    const addScheduleItem = (item: ScheduleItem) => {
        setScheduleItems(prev => [...prev, item]);
    };

    const removeScheduleItem = (id: string) => {
        setScheduleItems(prev => prev.filter(item => item.id !== id));
    };

    const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
        setScheduleItems(prev => prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    return (
        <ScheduleContext.Provider value={{ 
            scheduleItems,
            recurringItems,
            allScheduleItems,
            addScheduleItem, 
            removeScheduleItem, 
            updateScheduleItem,
            currentDate,
            setCurrentDate
        }}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
};

