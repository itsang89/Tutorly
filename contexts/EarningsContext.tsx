import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Transaction, ScheduleItem } from '../types';
import { useSchedule } from './ScheduleContext';
import { useStudents } from './StudentsContext';

interface EarningsContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Transaction) => void;
    removeTransaction: (id: string) => void;
    removeTransactionsByScheduleItemId: (scheduleItemId: string) => void;
}

const EarningsContext = createContext<EarningsContextType | undefined>(undefined);

export const EarningsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { scheduleItems } = useSchedule();
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

    // Function to check and generate earnings for past sessions
    const checkAndGenerateEarnings = useCallback(() => {
        const now = new Date();
        const newTransactions: Transaction[] = [];
        const newProcessedLessons = new Set(processedLessons);

        // Process one-off schedule items with specific dates
        scheduleItems.forEach((item) => {
            if (item.date && item.studentId) {
                const lessonDate = new Date(item.date);
                const [hours, minutes] = [Math.floor(item.startTime), Math.round((item.startTime % 1) * 60)];
                lessonDate.setHours(hours, minutes, 0, 0);
                
                // Check if lesson has passed (including the end time)
                const lessonEndTime = new Date(lessonDate);
                const durationMinutes = item.duration * 60;
                const totalMinutes = minutes + durationMinutes;
                const endHours = hours + Math.floor(totalMinutes / 60);
                const endMinutes = totalMinutes % 60;
                lessonEndTime.setHours(endHours, endMinutes, 0, 0);
                
                // Only generate earnings if the lesson has completely passed (end time has passed)
                if (lessonEndTime < now) {
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

        // Recurring schedule items should not generate past earnings
        // Only one-time sessions with specific dates generate earnings when they pass

        // Add new transactions if any were generated
        if (newTransactions.length > 0) {
            setTransactions(prev => [...newTransactions, ...prev]);
            setProcessedLessons(newProcessedLessons);
        }
    }, [scheduleItems, students, processedLessons]);

    // Periodically check for sessions that have passed (every minute)
    // This ensures earnings are generated when future sessions become past sessions
    useEffect(() => {
        // Check immediately when schedule items change or component mounts
        checkAndGenerateEarnings();
        
        // Set up interval to check every minute for sessions that have passed
        const interval = setInterval(() => {
            checkAndGenerateEarnings();
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, [checkAndGenerateEarnings]);

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    };

    const removeTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const removeTransactionsByScheduleItemId = (scheduleItemId: string) => {
        // Remove all transactions that were generated from this schedule item
        // Transaction IDs are in format: transaction-${scheduleItemId}-...
        setTransactions(prev => prev.filter(t => {
            // Check if transaction ID starts with the schedule item ID pattern
            // For one-off: transaction-${item.id}-${Date.now()}
            // For recurring: transaction-${item.id}-${date.toISOString()}-${Date.now()}
            const transactionPrefix = `transaction-${scheduleItemId}-`;
            return !t.id.startsWith(transactionPrefix);
        }));

        // Remove all processed lesson keys for this schedule item
        // Processed lesson keys are in format: ${scheduleItemId}-${date}
        setProcessedLessons(prev => {
            const newSet = new Set(prev);
            const keysToRemove: string[] = [];
            newSet.forEach(key => {
                if (key.startsWith(`${scheduleItemId}-`)) {
                    keysToRemove.push(key);
                }
            });
            keysToRemove.forEach(key => newSet.delete(key));
            return newSet;
        });
    };

    return (
        <EarningsContext.Provider value={{ transactions, addTransaction, removeTransaction, removeTransactionsByScheduleItemId }}>
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
