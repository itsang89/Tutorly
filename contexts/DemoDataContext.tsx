import React, { createContext, useContext, useState, ReactNode } from 'react';
import { demoData, DemoData } from '../data/demoData';

interface DemoDataContextType {
    hasDemoData: boolean;
    loadDemoData: () => void;
    clearDemoData: () => void;
    getDemoData: () => DemoData;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [hasDemoData, setHasDemoData] = useState(false);

    const loadDemoData = () => {
        setHasDemoData(true);
        // Store in localStorage to persist across page refreshes
        localStorage.setItem('tutorly_hasDemoData', 'true');
        
        // Load demo data into localStorage for contexts to pick up
        const data = demoData;
        
        // Load students
        localStorage.setItem('tutorly_students', JSON.stringify(data.students));
        console.log('Demo data: Loaded', data.students.length, 'students');
        
        // Load schedule items
        localStorage.setItem('tutorly_scheduleItems', JSON.stringify(data.scheduleItems));
        console.log('Demo data: Loaded', data.scheduleItems.length, 'schedule items');
        
        // Load transactions
        localStorage.setItem('tutorly_transactions', JSON.stringify(data.transactions));
        console.log('Demo data: Loaded', data.transactions.length, 'transactions');
        
        // Mark processed lessons for earnings context to prevent duplicate transactions
        const processedLessons = new Set<string>();
        
        // Mark one-off lessons that have transactions
        data.scheduleItems.forEach(item => {
            if (item.date) {
                processedLessons.add(`${item.id}-${item.date}`);
            }
        });
        
        // Mark recurring lessons that already have transactions
        // For each transaction, find the corresponding recurring schedule item
        data.transactions.forEach(trans => {
            // Find the student
            const student = data.students.find(s => s.name === trans.student);
            if (student && student.weeklySchedule) {
                // Find which recurring slot this transaction corresponds to
                student.weeklySchedule.forEach((slot, index) => {
                    const recurringId = `recurring-${student.id}-${slot.day}-${index}`;
                    // Check if the transaction date matches the day of week for this slot
                    const transDate = new Date(trans.date);
                    const dayOfWeek = (transDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                    if (dayOfWeek === slot.day) {
                        processedLessons.add(`${recurringId}-${trans.date}`);
                    }
                });
            }
        });
        
        localStorage.setItem('tutorly_processedLessons', JSON.stringify(Array.from(processedLessons)));
    };

    const clearDemoData = () => {
        setHasDemoData(false);
        localStorage.removeItem('tutorly_hasDemoData');
        localStorage.removeItem('tutorly_students');
        localStorage.removeItem('tutorly_scheduleItems');
        localStorage.removeItem('tutorly_transactions');
        localStorage.removeItem('tutorly_processedLessons');
    };

    const getDemoData = () => demoData;

    // Check localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem('tutorly_hasDemoData');
        if (stored === 'true') {
            setHasDemoData(true);
        }
    }, []);

    return (
        <DemoDataContext.Provider value={{ hasDemoData, loadDemoData, clearDemoData, getDemoData }}>
            {children}
        </DemoDataContext.Provider>
    );
};

export const useDemoData = () => {
    const context = useContext(DemoDataContext);
    if (context === undefined) {
        throw new Error('useDemoData must be used within a DemoDataProvider');
    }
    return context;
};

