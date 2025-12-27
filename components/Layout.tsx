import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDemoData } from '../contexts/DemoDataContext';
import { ToastContainer, createToast } from './Toast';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const { hasDemoData, loadDemoData, clearDemoData } = useDemoData();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDemoDataModal, setShowDemoDataModal] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);

    const handleLoadDemoData = () => {
        loadDemoData();
        createToast('Loading demo data...', 'info', setToasts);
        setShowDemoDataModal(false);
        // Small delay to ensure localStorage is written before reload
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const handleClearDemoData = () => {
        clearDemoData();
        createToast('Demo data cleared. Reloading...', 'info', setToasts);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const navItems = [
        { name: 'Overview', icon: 'dashboard', path: '/dashboard' },
        { name: 'Students', icon: 'group', path: '/students' },
        { name: 'Schedule', icon: 'calendar_month', path: '/schedule' },
        { name: 'Lessons', icon: 'event', path: '/lessons' },
        { name: 'Earnings', icon: 'account_balance_wallet', path: '/earnings' },
        { name: 'Settings', icon: 'settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Mobile Header */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl mx-auto flex items-center justify-between bg-surface/80 backdrop-blur-xl border border-white/50 shadow-soft rounded-full px-6 py-3 lg:hidden">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-accent text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">school</span>
                    </div>
                    <span className="font-bold text-stone-900">Tutorly</span>
                </div>
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="size-10 rounded-full bg-stone-100 flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-stone-600">
                        {mobileMenuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-surface/95 backdrop-blur-md lg:hidden flex flex-col pt-24 px-6 gap-4 pb-6">
                    {navItems.map((item) => (
                         <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200
                                ${isActive 
                                    ? 'bg-accent text-white font-medium shadow-lg' 
                                    : 'text-secondary hover:text-stone-900 hover:bg-stone-100'}
                            `}
                        >
                            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                            <span className="text-lg">{item.name}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={() => {
                            setShowDemoDataModal(true);
                            setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                            hasDemoData 
                                ? 'bg-stone-100 text-stone-700 border border-stone-200' 
                                : 'bg-primary text-primary-content'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[24px]">database</span>
                        <span className="text-lg">{hasDemoData ? 'Demo Data' : 'Load Demo Data'}</span>
                    </button>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-24 xl:w-72 flex-col shrink-0 py-8 px-6 transition-all duration-300 h-full relative z-20">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="h-10 px-4 rounded-full bg-stone-200/50 border border-stone-300 text-stone-900 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                        <span className="font-bold tracking-tight text-lg hidden xl:block">Tutorly</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 group
                                ${isActive 
                                    ? 'bg-accent text-white font-medium shadow-lg shadow-stone-300/50' 
                                    : 'text-secondary hover:text-stone-900 hover:bg-white/60'}
                            `}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${!location.pathname.startsWith(item.path) && 'group-hover:scale-110'} transition-transform`}>
                                {item.icon}
                            </span>
                            <span className="hidden xl:block text-sm">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto space-y-3">
                    <button
                        onClick={() => setShowDemoDataModal(true)}
                        className={`w-full px-4 py-3 rounded-2xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 ${
                            hasDemoData 
                                ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200' 
                                : 'bg-primary text-primary-content hover:bg-yellow-400'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">database</span>
                        <span className="hidden xl:inline">{hasDemoData ? 'Demo Data' : 'Load Demo Data'}</span>
                    </button>
                    <div className="p-4 rounded-3xl bg-surface border border-white shadow-soft flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div 
                                className="size-10 rounded-full bg-cover bg-center ring-2 ring-white shadow-sm"
                                style={{ backgroundImage: 'url("https://picsum.photos/100/100?random=1")' }}
                            ></div>
                            <div className="flex flex-col overflow-hidden hidden xl:flex">
                                <span className="text-sm font-bold truncate text-stone-900">Alex Taylor</span>
                                <span className="text-xs text-secondary truncate">Senior Tutor</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden pt-24 lg:pt-0">
                {children}
            </main>

            {/* Demo Data Modal */}
            {showDemoDataModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowDemoDataModal(false)}
                    />
                    <div className="relative bg-surface rounded-3xl shadow-xl border border-white w-full max-w-md z-10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-stone-900">Load Demo Data</h2>
                            <button
                                onClick={() => setShowDemoDataModal(false)}
                                className="size-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <p className="text-sm text-stone-600 mb-6">
                            Load sample data including students, transactions, todos, and chart data to see the app in action.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleLoadDemoData}
                                className="w-full px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                            >
                                Load Demo Data
                            </button>
                            {hasDemoData && (
                                <button
                                    onClick={handleClearDemoData}
                                    className="w-full px-4 py-3 rounded-full border border-red-200 text-red-600 bg-red-50 font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    Clear Demo Data
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default Layout;
