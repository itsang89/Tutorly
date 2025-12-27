import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Transaction, ScheduleItem } from '../types';
import { useSchedule } from './ScheduleContext';
import { useStudents } from './StudentsContext';

interface EarningsContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Transaction) => void;
    removeTransaction: (id: string) => void;
}

const EarningsContext = createContext<EarningsContextType | undefined>(undefined);

export const EarningsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { scheduleItems, recurringItems } = useSchedule();
    const { students } = useStudents();
    // Initialize state from localStorage immediately
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const stored = localStorage.getItem('tutorly_transactions');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse stored transactions:', e);
                return [];
            }
        }
        return [];
    });
    const [processedLessons, setProcessedLessons] = useState<Set<string>>(() => {
        const stored = localStorage.getItem('tutorly_processedLessons');
        if (stored) {
            try {
                return new Set(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored processed lessons:', e);
                return new Set();
            }
        }
        return new Set();
    });

    // Load transactions and processed lessons from localStorage on mount (in case it changed externally)
    useEffect(() => {
        const storedTransactions = localStorage.getItem('tutorly_transactions');
        if (storedTransactions) {
            try {
                const parsed = JSON.parse(storedTransactions);
                setTransactions(parsed);
            } catch (e) {
                console.error('Failed to parse stored transactions:', e);
            }
        }

        const storedProcessed = localStorage.getItem('tutorly_processedLessons');
        if (storedProcessed) {
            try {
                const parsed = JSON.parse(storedProcessed);
                setProcessedLessons(new Set(parsed));
            } catch (e) {
                console.error('Failed to parse stored processed lessons:', e);
            }
        }
    }, []);

    // Save transactions to localStorage whenever they change (but skip initial empty array)
    useEffect(() => {
        if (transactions.length > 0 || localStorage.getItem('tutorly_transactions')) {
            localStorage.setItem('tutorly_transactions', JSON.stringify(transactions));
        }
    }, [transactions]);

    // Save processed lessons to localStorage whenever they change
    useEffect(() => {
        if (processedLessons.size > 0 || localStorage.getItem('tutorly_processedLessons')) {
            localStorage.setItem('tutorly_processedLessons', JSON.stringify(Array.from(processedLessons)));
        }
    }, [processedLessons]);

    // Generate transactions from past lessons
    useEffect(() => {
        const now = new Date();
        const newTransactions: Transaction[] = [];
        const newProcessedLessons = new Set(processedLessons);

        // Process one-off schedule items with specific dates
        scheduleItems.forEach((item) => {
            if (item.date && item.studentId) {
                const lessonDate = new Date(item.date);
                const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                lessonDate.setHours(hours, minutes, 0, 0);
                
                // Check if lesson has passed
                if (lessonDate < now) {
                    const lessonKey = `${item.id}-${item.date}`;
                    
                    // Only process if not already processed
                    if (!newProcessedLessons.has(lessonKey)) {
                        const student = students.find(s => s.id === item.studentId);
                        if (student && student.pricePerHour) {
                            const amount = student.pricePerHour * item.duration;
                            const transactionDate = lessonDate.toISOString().split('T')[0];
                            
                            const transaction: Transaction = {
                                id: `transaction-${item.id}-${Date.now()}`,
                                date: transactionDate,
                                student: student.name,
                                initials: student.initials,
                                subject: student.subject,
                                status: 'Paid',
                                amount: amount,
                                color: student.color,
                                duration: item.duration,
                            };
                            
                            newTransactions.push(transaction);
                            newProcessedLessons.add(lessonKey);
                        }
                    }
                }
            }
        });

        // Process recurring schedule items - generate instances for all past dates
        recurringItems.forEach((item) => {
            if (item.studentId) {
                const student = students.find(s => s.id === item.studentId);
                if (!student || !student.pricePerHour) return;

                // Generate instances for past dates (up to 1 year back)
                const today = new Date();
                for (let i = 0; i <= 365; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                    
                    if (dayOfWeek === item.day) {
                        const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                        const lessonDateTime = new Date(date);
                        lessonDateTime.setHours(hours, minutes, 0, 0);
                        
                        // Check if lesson has passed
                        if (lessonDateTime < now) {
                            const lessonKey = `${item.id}-${date.toISOString().split('T')[0]}`;
                            
                            // Only process if not already processed
                            if (!newProcessedLessons.has(lessonKey)) {
                                const amount = student.pricePerHour * item.duration;
                                const transactionDate = date.toISOString().split('T')[0];
                                
                                const transaction: Transaction = {
                                    id: `transaction-${item.id}-${date.toISOString()}-${Date.now()}`,
                                    date: transactionDate,
                                    student: student.name,
                                    initials: student.initials,
                                    subject: student.subject,
                                    status: 'Paid',
                                    amount: amount,
                                    color: student.color,
                                    duration: item.duration,
                                };
                                
                                newTransactions.push(transaction);
                                newProcessedLessons.add(lessonKey);
                            }
                        }
                    }
                }
            }
        });

        // Add new transactions if any were generated
        if (newTransactions.length > 0) {
            setTransactions(prev => [...newTransactions, ...prev]);
            setProcessedLessons(newProcessedLessons);
        }
    }, [scheduleItems, recurringItems, students, processedLessons]);

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    };

    const removeTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <EarningsContext.Provider value={{ transactions, addTransaction, removeTransaction }}>
            {children}
        </EarningsContext.Provider>
    );
};

export const useEarnings = () => {
    const context = useContext(EarningsContext);
    if (context === undefined) {
        throw new Error('useEarnings must be used within an EarningsProvider');
    }
    return context;
};

