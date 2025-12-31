import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ToastContainer, createToast } from '../components/Toast';
import { useEarnings } from '../contexts/EarningsContext';
import { calculateTotalEarnings, calculateEarningsThisMonth, calculateAverageHourlyRate } from '../utils/earningsCalculations';

const Earnings: React.FC = () => {
    const { transactions } = useEarnings();
    const [chartPeriod, setChartPeriod] = useState<'monthly' | 'weekly'>('monthly');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);

    // Calculate stats from transactions
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const totalBalance = calculateTotalEarnings(transactions);
        const thisMonth = calculateEarningsThisMonth(transactions);
        const avgHourlyRate = calculateAverageHourlyRate(transactions);

        // Calculate previous month for comparison
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === prevMonth && 
                   transactionDate.getFullYear() === prevYear;
        });
        const prevMonthTotal = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const monthChange = prevMonthTotal > 0 
            ? ((thisMonth - prevMonthTotal) / prevMonthTotal) * 100 
            : 0;

        // Calculate previous period total balance for percentage change
        // Compare with balance from 30 days ago
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const prevPeriodTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate < thirtyDaysAgo;
        });
        const prevPeriodTotal = prevPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalBalanceChange = prevPeriodTotal > 0 
            ? ((totalBalance - prevPeriodTotal) / prevPeriodTotal) * 100 
            : (totalBalance > 0 ? 100 : 0);

        return {
            totalBalance,
            thisMonth,
            avgHourlyRate,
            monthChange,
            totalBalanceChange,
        };
    }, [transactions]);

    // Calculate chart data for Revenue Analytics
    const chartData = useMemo(() => {
        if (chartPeriod === 'monthly') {
            // Last 6 months
            const months: { name: string; value: number }[] = [];
            const now = new Date();
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                const month = date.getMonth();
                const year = date.getFullYear();
                
                const monthTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getMonth() === month && 
                           transactionDate.getFullYear() === year;
                });
                
                const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
                months.push({ name: monthName, value: total });
            }
            
            return months;
        } else {
            // Last 7 weeks (Monday to Sunday)
            const weeks: { name: string; value: number }[] = [];
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            for (let i = 6; i >= 0; i--) {
                const weekDate = new Date(now);
                weekDate.setDate(now.getDate() - (i * 7));
                
                // Get Monday of the week
                const dayOfWeek = (weekDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                const weekStart = new Date(weekDate);
                weekStart.setDate(weekDate.getDate() - dayOfWeek);
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                const weekTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    transactionDate.setHours(0, 0, 0, 0);
                    return transactionDate >= weekStart && transactionDate <= weekEnd;
                });
                
                const total = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
                const weekName = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                weeks.push({ name: weekName, value: total });
            }
            
            return weeks;
        }
    }, [transactions, chartPeriod]);

    // Calculate subject breakdown
    const subjectData = useMemo(() => {
        const subjectMap = new Map<string, number>();
        
        transactions.forEach(t => {
            const current = subjectMap.get(t.subject) || 0;
            subjectMap.set(t.subject, current + t.amount);
        });
        
        const total = Array.from(subjectMap.values()).reduce((sum, val) => sum + val, 0);
        
        return Array.from(subjectMap.entries())
            .map(([subject, amount]) => ({
                subject,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5); // Top 5 subjects
    }, [transactions]);

    const maxChartValue = useMemo(() => {
        if (chartData.length === 0) return 1;
        return Math.max(...chartData.map(d => d.value), 1);
    }, [chartData]);

    const handleExport = useCallback(() => {
        const csv = [
            ['Date', 'Student', 'Subject', 'Status', 'Amount'],
            ...transactions.map(t => [t.date, t.student, t.subject, t.status, `$${t.amount.toFixed(2)}`])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        createToast('Earnings exported successfully!', 'success', setToasts);
    }, [transactions]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showMoreOptions && !(e.target as Element).closest('.more-options')) {
                setShowMoreOptions(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showMoreOptions]);
    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Earnings Report</h1>
                    <div className="flex items-center gap-2 text-secondary text-sm font-medium mt-1">
                        <span>Overview of your financial performance</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button 
                        onClick={handleExport}
                        aria-label="Export earnings data"
                        className="px-5 h-12 rounded-full bg-surface border border-white text-stone-700 font-bold text-sm hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
                        <span>Export</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto">
                    {/* Mobile Export Button */}
                    <div className="lg:hidden mb-6">
                        <button 
                            onClick={handleExport}
                            aria-label="Export earnings data"
                            className="w-full px-5 h-12 rounded-full bg-surface border border-white text-stone-700 font-bold text-sm hover:bg-stone-50 transition-colors shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
                            <span>Export CSV</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                        <div className="bg-accent rounded-3xl p-6 shadow-xl shadow-stone-900/10 border border-stone-800 text-white relative overflow-hidden bento-card">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                                    </div>
                                    <span className={`bg-primary/20 text-primary px-2 py-1 rounded-full text-[10px] font-bold ${
                                        stats.totalBalanceChange >= 0 ? '' : 'bg-red-500/20 text-red-500'
                                    }`}>
                                        {stats.totalBalanceChange >= 0 ? '+' : ''}{stats.totalBalanceChange.toFixed(1)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">Total Balance</span>
                                    <h2 className="text-3xl font-bold mt-1">${stats.totalBalance.toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface rounded-3xl p-6 shadow-soft border border-white relative bento-card">
                            <div className="flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="size-10 rounded-full bg-stone-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-stone-600 text-[20px]">calendar_today</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-secondary text-xs font-bold uppercase tracking-wider">This Month</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h2 className="text-3xl font-light text-stone-800">${stats.thisMonth.toFixed(2)}</h2>
                                        {stats.monthChange !== 0 && (
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                stats.monthChange >= 0 
                                                    ? 'text-green-600 bg-green-50' 
                                                    : 'text-red-600 bg-red-50'
                                            }`}>
                                                {stats.monthChange >= 0 ? '↑' : '↓'} {Math.abs(stats.monthChange).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface rounded-3xl p-6 shadow-soft border border-white relative bento-card">
                            <div className="flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="size-10 rounded-full bg-stone-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-stone-600 text-[20px]">trending_up</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-secondary text-xs font-bold uppercase tracking-wider">Avg. Hourly Rate</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h2 className="text-3xl font-light text-stone-800">${stats.avgHourlyRate.toFixed(2)}</h2>
                                        <span className="text-xs text-stone-400 font-medium">realized</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                        <div className="md:col-span-8 bg-surface rounded-3xl p-8 bento-card shadow-card border border-white min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-stone-800">Revenue Analytics</h3>
                                    <p className="text-xs text-secondary mt-1">Income trend over the last 6 months</p>
                                </div>
                                <div className="flex bg-stone-100 p-1 rounded-full">
                                    <button 
                                        onClick={() => setChartPeriod('monthly')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            chartPeriod === 'monthly' 
                                                ? 'bg-white shadow-sm text-stone-800' 
                                                : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        onClick={() => setChartPeriod('weekly')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            chartPeriod === 'weekly' 
                                                ? 'bg-white shadow-sm text-stone-800' 
                                                : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-end">
                                {chartData.length > 0 && maxChartValue > 0 ? (
                                    <div className="flex items-end justify-between gap-2 h-full pb-4">
                                        {chartData.map((item, index) => (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full flex flex-col items-center justify-end" style={{ height: '200px' }}>
                                                    <div 
                                                        className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80 min-h-[4px]"
                                                        style={{ 
                                                            height: `${(item.value / maxChartValue) * 100}%`,
                                                            minHeight: item.value > 0 ? '4px' : '0px'
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-stone-800">${item.value.toFixed(0)}</p>
                                                    <p className="text-[10px] text-stone-500 mt-0.5">{item.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center text-stone-400">
                                            <span className="material-symbols-outlined text-5xl mb-2">bar_chart</span>
                                            <p className="text-sm">No revenue data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-4 bg-surface rounded-3xl p-8 bento-card shadow-card border border-white flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 z-10">
                                <h3 className="text-lg font-bold text-stone-800">By Subject</h3>
                                <div className="relative more-options">
                                    <button 
                                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                                        aria-label="More options"
                                        aria-expanded={showMoreOptions}
                                        className="size-8 rounded-full bg-stone-50 flex items-center justify-center hover:bg-stone-100 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-stone-500" aria-hidden="true">more_horiz</span>
                                    </button>
                                    {showMoreOptions && (
                                        <div className="absolute right-0 top-10 w-48 bg-surface rounded-2xl shadow-xl border border-white p-2 z-50">
                                            <button 
                                                onClick={() => {
                                                    createToast('Subject details view coming soon', 'info', setToasts);
                                                    setShowMoreOptions(false);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    // Export subject breakdown data
                                                    const csv = [
                                                        ['Subject', 'Amount', 'Percentage'],
                                                        ...subjectData.map(item => [
                                                            item.subject,
                                                            `$${item.amount.toFixed(2)}`,
                                                            `${item.percentage.toFixed(1)}%`
                                                        ])
                                                    ].map(row => row.join(',')).join('\n');
                                                    
                                                    const blob = new Blob([csv], { type: 'text/csv' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `earnings-by-subject-${new Date().toISOString().split('T')[0]}.csv`;
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    createToast('Subject data exported successfully!', 'success', setToasts);
                                                    setShowMoreOptions(false);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                Export Data
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    createToast('Subject settings coming soon', 'info', setToasts);
                                                    setShowMoreOptions(false);
                                                }}
                                                className="w-full px-3 py-2 rounded-xl text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                                            >
                                                Settings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4 flex-1 z-10">
                                {subjectData.length > 0 ? (
                                    <div className="space-y-3">
                                        {subjectData.map((item, index) => {
                                            const colors = [
                                                'bg-primary',
                                                'bg-blue-500',
                                                'bg-amber-500',
                                                'bg-green-500',
                                                'bg-purple-500'
                                            ];
                                            const color = colors[index % colors.length];
                                            
                                            return (
                                                <div key={item.subject} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-stone-800">{item.subject}</span>
                                                        <span className="text-xs font-bold text-stone-600">${item.amount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-full ${color} rounded-full transition-all`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-stone-500">{item.percentage.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-stone-400">
                                            <span className="material-symbols-outlined text-4xl mb-2">pie_chart</span>
                                            <p className="text-sm">No subject data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                             <div className="absolute bottom-0 right-0 w-48 h-48 bg-background rounded-full translate-x-1/2 translate-y-1/2 opacity-50 pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-surface rounded-3xl p-0 bento-card shadow-card border border-white flex flex-col overflow-hidden">
                        <div className="p-6 pb-4 flex justify-between items-center border-b border-stone-50">
                            <h3 className="text-lg font-bold text-stone-800">Earnings History</h3>
                            <div className="text-sm text-stone-500">
                                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-stone-400 font-bold border-b border-stone-100">
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {transactions.length > 0 ? transactions.map(t => (
                                         <tr key={t.id} className="group hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4 text-stone-500">{t.date}</td>
                                            <td className="px-6 py-4 font-bold text-stone-800 flex items-center gap-2">
                                                <div className={`size-6 rounded-full ${t.color === 'primary' ? 'bg-primary/20' : 'bg-stone-200'} text-[10px] flex items-center justify-center`}>{t.initials}</div>
                                                {t.student}
                                            </td>
                                            <td className="px-6 py-4 text-stone-500">{t.subject}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${t.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-stone-800">${t.amount.toFixed(2)}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="material-symbols-outlined text-5xl text-stone-300">receipt_long</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-600">No earnings yet</p>
                                                        <p className="text-xs text-stone-400 mt-1">Earnings will appear here automatically when lessons are completed</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default Earnings;
