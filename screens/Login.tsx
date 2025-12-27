import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { ToastContainer, createToast } from '../components/Toast';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    const handleForgotPassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        createToast(`Password reset link sent to ${email}`, 'success', setToasts);
        setShowForgotPasswordModal(false);
    };

    const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createToast('Account created successfully! Please sign in.', 'success', setToasts);
        setShowSignupModal(false);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 lg:p-8 bg-background">
            <div className="w-full max-w-5xl bg-surface rounded-3xl shadow-card border border-white overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[650px] relative">
                <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10 bg-surface/50 backdrop-blur-sm">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg shadow-stone-900/10">
                                <span className="material-symbols-outlined text-[20px]">school</span>
                            </div>
                            <span className="font-bold text-stone-900 text-xl tracking-tight">Tutorly</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">Welcome back</h1>
                        <p className="text-secondary text-sm lg:text-base">Please enter your details to sign in to your dashboard.</p>
                    </div>
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide ml-1" htmlFor="email">Email or Username</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors">mail</span>
                                <input className="w-full h-12 rounded-2xl bg-stone-50 border border-stone-200 pl-11 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none" id="email" placeholder="alex@tutorly.com" type="email" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide ml-1" htmlFor="password">Password</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors">lock</span>
                                <input className="w-full h-12 rounded-2xl bg-stone-50 border border-stone-200 pl-11 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none" id="password" placeholder="••••••••" type="password" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input id="remember-me" name="remember-me" className="rounded border-stone-300 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer" type="checkbox" />
                                <span className="text-stone-600 group-hover:text-stone-800 transition-colors">Remember me</span>
                            </label>
                            <button 
                                type="button" 
                                onClick={() => setShowForgotPasswordModal(true)}
                                className="font-bold text-stone-600 hover:text-accent transition-colors underline decoration-stone-300 underline-offset-4 hover:decoration-accent"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button className="w-full h-12 rounded-full bg-accent text-white font-bold text-base hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-4" type="submit">
                            <span>Sign In</span>
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <p className="text-sm text-stone-500">Don't have an account? <button 
                            onClick={() => setShowSignupModal(true)}
                            className="font-bold text-primary-content hover:text-accent transition-colors"
                        >
                            Join as a Tutor
                        </button></p>
                    </div>
                </div>
                <div className="hidden md:block w-1/2 bg-stone-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-90 grayscale brightness-110 contrast-75 mix-blend-multiply" style={{ backgroundImage: 'url("https://picsum.photos/600/800?random=4")' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/90 via-accent/40 to-transparent mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
                    <div className="absolute top-12 right-12 bg-white/90 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-soft max-w-[200px] animate-float">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-stone-500 uppercase">Earnings</span>
                                <span className="text-sm font-bold text-stone-900">+$240.50</span>
                            </div>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 w-[70%] h-full rounded-full"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-20 left-12 bg-white/90 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-soft max-w-[220px] animate-float-reverse">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img alt="Student" className="w-full h-full object-cover" src="https://picsum.photos/100/100?random=5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-stone-900">Emma just booked</p>
                                <p className="text-[10px] text-stone-500">Physics Session • 2pm</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-12 right-12 text-right max-w-xs">
                        <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">Empower your teaching journey.</h2>
                        <p className="text-stone-200 text-sm font-medium">Manage students, schedule classes, and track earnings all in one place.</p>
                    </div>
                </div>
            </div>
            {/* Background Decorations */}
             <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-stone-300/20 rounded-full blur-3xl"></div>
            </div>

            {/* Modals */}
            <Modal isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} title="Reset Password" size="sm">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-stone-600">Enter your email address and we'll send you a link to reset your password.</p>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Email Address</label>
                        <input 
                            name="email" 
                            type="email" 
                            className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" 
                            placeholder="your@email.com" 
                            required 
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setShowForgotPasswordModal(false)} 
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Send Reset Link
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} title="Join as a Tutor" size="lg">
                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">First Name</label>
                            <input 
                                name="firstName" 
                                type="text" 
                                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Last Name</label>
                            <input 
                                name="lastName" 
                                type="text" 
                                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Email Address</label>
                        <input 
                            name="email" 
                            type="email" 
                            className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" 
                            placeholder="your@email.com" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Password</label>
                        <input 
                            name="password" 
                            type="password" 
                            className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" 
                            placeholder="••••••••" 
                            required 
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Subjects You Teach</label>
                        <select 
                            name="subjects" 
                            multiple 
                            className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all min-h-[100px]" 
                            required
                        >
                            <option value="math">Mathematics</option>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="biology">Biology</option>
                            <option value="english">English</option>
                        </select>
                        <p className="text-xs text-stone-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            id="terms" 
                            name="terms" 
                            type="checkbox" 
                            className="rounded border-stone-300 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer" 
                            required 
                        />
                        <label htmlFor="terms" className="text-xs text-stone-600">
                            I agree to the Terms of Service and Privacy Policy
                        </label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setShowSignupModal(false)} 
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Create Account
                        </button>
                    </div>
                </form>
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default Login;
