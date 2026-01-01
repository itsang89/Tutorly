import { Transaction } from '../types';

/**
 * Calculate total earnings from all transactions
 */
export const calculateTotalEarnings = (transactions: Transaction[]): number => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate earnings for a specific month
 */
export const calculateEarningsForMonth = (transactions: Transaction[], year: number, month: number): number => {
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === month && 
                   transactionDate.getFullYear() === year;
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate earnings for the current month
 */
export const calculateEarningsThisMonth = (transactions: Transaction[]): number => {
    const now = new Date();
    return calculateEarningsForMonth(transactions, now.getFullYear(), now.getMonth());
};

/**
 * Calculate earnings for a specific week (Monday to Sunday)
 */
export const calculateEarningsForWeek = (transactions: Transaction[], weekStart: Date): number => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            transactionDate.setHours(0, 0, 0, 0);
            return transactionDate >= weekStart && transactionDate <= weekEnd;
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate earnings for the current week (Monday to Sunday)
 */
export const calculateEarningsThisWeek = (transactions: Transaction[]): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    return calculateEarningsForWeek(transactions, weekStart);
};

/**
 * Calculate average hourly rate from transactions
 */
export const calculateAverageHourlyRate = (transactions: Transaction[]): number => {
    const totalBalance = calculateTotalEarnings(transactions);
    const totalHours = transactions.reduce((sum, t) => sum + (t.duration || 0), 0);
    return totalHours > 0 ? totalBalance / totalHours : 0;
};



