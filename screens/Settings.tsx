import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { ToastContainer, createToast } from '../components/Toast';
import { useUserProfile } from '../contexts/UserProfileContext';

type SettingsSection = 'profile' | 'notifications' | 'security';


const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { profile, updateProfile, addSubject, removeSubject } = useUserProfile();
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
    const [newSubject, setNewSubject] = useState('');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showRemoveAllDataModal, setShowRemoveAllDataModal] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([]);
    const [notificationsRead, setNotificationsRead] = useState(false);

    const handleSaveProfile = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateProfile({
            firstName: (formData.get('first-name') as string) || profile.firstName,
            lastName: (formData.get('last-name') as string) || profile.lastName,
            phone: (formData.get('phone') as string) || profile.phone,
            bio: (formData.get('bio') as string) || profile.bio,
            title: (formData.get('title') as string) || profile.title,
        });
        createToast('Profile updated successfully!', 'success', setToasts);
    }, [profile, updateProfile]);

    const handleChangePassword = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createToast('Password changed successfully!', 'success', setToasts);
        setShowChangePasswordModal(false);
    }, []);


    const handleDeleteAccount = useCallback(() => {
        createToast('Account deletion requested.', 'info', setToasts);
        setShowDeleteAccountModal(false);
    }, []);

    const handleLogout = useCallback(() => {
        createToast('Logged out successfully', 'success', setToasts);
        setTimeout(() => {
            navigate('/');
        }, 500);
    }, [navigate]);

    const handleRemoveAllData = useCallback(() => {
        // Clear all localStorage items starting with 'tutorly_'
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tutorly_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        createToast('All data removed successfully. Reloading...', 'success', setToasts);
        setShowRemoveAllDataModal(false);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showNotifications && !(e.target as Element).closest('.notifications-dropdown')) {
                setShowNotifications(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showNotifications]);
    return (
        <>
            <header className="hidden lg:flex items-center justify-between px-10 py-8 shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Account Settings</h1>
                    <p className="text-secondary text-sm font-medium">Manage your profile, preferences, and security</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowHelpModal(true)}
                        className="px-5 h-12 rounded-full bg-surface border border-white text-stone-600 font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">help</span>
                        <span>Help Center</span>
                    </button>
                    <div className="relative notifications-dropdown">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="size-12 rounded-full bg-surface border border-white flex items-center justify-center text-stone-600 hover:text-stone-900 hover:shadow-md transition-all shadow-sm relative"
                        >
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 top-14 w-80 bg-surface rounded-2xl shadow-xl border border-white p-4 z-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-stone-900">Notifications</h3>
                                    <button 
                                        onClick={() => {
                                            setNotificationsRead(true);
                                            createToast('All notifications marked as read', 'success', setToasts);
                                        }}
                                        className="text-xs text-primary hover:text-primary-content"
                                    >
                                        Mark all read
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {!notificationsRead && (
                                        <div className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                            <p className="text-sm font-bold text-stone-900">Settings updated</p>
                                            <p className="text-xs text-stone-500">Your profile changes were saved</p>
                                            <p className="text-[10px] text-stone-400 mt-1">5 minutes ago</p>
                                        </div>
                                    )}
                                    {notificationsRead && (
                                        <div className="p-8 text-center text-stone-400">
                                            <span className="material-symbols-outlined text-4xl mb-2">notifications_none</span>
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10">
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-8">
                        {/* Sidebar Menu */}
                        <div className="xl:col-span-3 space-y-6">
                            <div className="bg-surface rounded-3xl p-6 bento-card shadow-card border border-white text-center">
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                    <div className="w-full h-full rounded-full bg-cover bg-center ring-4 ring-background" style={{ backgroundImage: 'url("https://picsum.photos/200/200?random=3")' }}></div>
                                    <button 
                                        onClick={() => setShowPhotoUploadModal(true)}
                                        className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full border-2 border-surface hover:bg-primary hover:text-stone-900 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                </div>
                                <h2 className="text-xl font-bold text-stone-900">{profile.firstName} {profile.lastName}</h2>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-content text-xs font-bold border border-primary/20">
                                    Top Rated Tutor
                                </div>
                            </div>
                            <div className="bg-surface rounded-3xl p-2 bento-card shadow-card border border-white">
                                <nav className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => setActiveSection('profile')}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
                                            activeSection === 'profile' 
                                                ? 'bg-background text-stone-900 font-bold' 
                                                : 'text-secondary hover:text-stone-900 hover:bg-stone-50'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                        <span className="text-sm">Profile Information</span>
                                    </button>
                                    <button 
                                        onClick={() => setActiveSection('notifications')}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left group ${
                                            activeSection === 'notifications' 
                                                ? 'bg-background text-stone-900 font-bold' 
                                                : 'text-secondary hover:text-stone-900 hover:bg-stone-50'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">notifications</span>
                                        <span className="text-sm">Notification Preferences</span>
                                    </button>
                                    <button 
                                        onClick={() => setActiveSection('security')}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left group ${
                                            activeSection === 'security' 
                                                ? 'bg-background text-stone-900 font-bold' 
                                                : 'text-secondary hover:text-stone-900 hover:bg-stone-50'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">shield</span>
                                        <span className="text-sm">Security & Login</span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Main Settings Content */}
                        <div className="xl:col-span-9 space-y-6">
                            {/* Profile Details */}
                            {activeSection === 'profile' && (
                            <div className="bg-surface rounded-3xl p-8 bento-card shadow-card border border-white">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-800">Profile Details</h3>
                                        <p className="text-sm text-secondary">Update your photo and personal details here.</p>
                                    </div>
                                </div>
                                <form onSubmit={handleSaveProfile}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">First Name</label>
                                            <input id="first-name" name="first-name" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" type="text" defaultValue={profile.firstName} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Last Name</label>
                                            <input id="last-name" name="last-name" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" type="text" defaultValue={profile.lastName} />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Title / Role</label>
                                            <input id="title" name="title" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" type="text" defaultValue={profile.title} placeholder="e.g., Math & Physics Expert" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
                                            <input id="phone" name="phone" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" type="tel" defaultValue={profile.phone} />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Bio</label>
                                            <textarea id="bio" name="bio" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all min-h-[100px] resize-none" defaultValue={profile.bio}></textarea>
                                        </div>
                                    </div>
                                    
                                    {/* Subjects Management */}
                                    <div className="mt-8 pt-8 border-t border-stone-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-stone-800">Subjects You Teach</h4>
                                                <p className="text-xs text-stone-500 mt-1">Manage the subjects you offer tutoring for</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={newSubject}
                                                onChange={(e) => setNewSubject(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (newSubject.trim()) {
                                                            addSubject(newSubject);
                                                            setNewSubject('');
                                                            createToast('Subject added!', 'success', setToasts);
                                                        }
                                                    }
                                                }}
                                                placeholder="Add a new subject..."
                                                className="flex-1 rounded-xl border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (newSubject.trim()) {
                                                        addSubject(newSubject);
                                                        setNewSubject('');
                                                        createToast('Subject added!', 'success', setToasts);
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold hover:bg-stone-800 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.subjects.map((subject) => (
                                                <div
                                                    key={subject}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-sm font-medium"
                                                >
                                                    <span>{subject}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            removeSubject(subject);
                                                            createToast('Subject removed', 'success', setToasts);
                                                        }}
                                                        className="text-stone-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                            {profile.subjects.length === 0 && (
                                                <p className="text-xs text-stone-400 italic">No subjects added yet</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6">
                                        <button type="submit" className="px-5 py-2 rounded-full bg-accent text-white text-sm font-bold shadow-lg hover:bg-stone-800 transition-colors">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                            )}

                            {/* Notifications Section */}
                            {activeSection === 'notifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface rounded-3xl p-8 bento-card shadow-card border border-white h-full">
                                    <h3 className="text-lg font-bold text-stone-800 mb-6">Notifications</h3>
                                    <div className="space-y-6">
                                        {['Email Notifications', 'Push Notifications'].map((item) => (
                                            <div key={item} className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-stone-800">{item}</h4>
                                                    <p className="text-xs text-stone-500">Receive updates about activity.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        id={`${item.toLowerCase().replace(' ', '-')}`} 
                                                        name={`${item.toLowerCase().replace(' ', '-')}`} 
                                                        type="checkbox" 
                                                        checked={item === 'Email Notifications' ? emailNotifications : pushNotifications}
                                                        onChange={(e) => {
                                                            if (item === 'Email Notifications') {
                                                                setEmailNotifications(e.target.checked);
                                                            } else {
                                                                setPushNotifications(e.target.checked);
                                                            }
                                                        }}
                                                        className="sr-only peer" 
                                                    />
                                                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </label>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-bold text-stone-800">SMS Notifications</h4>
                                                <p className="text-xs text-stone-500">Receive text messages for urgent alerts.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    id="sms-notifications" 
                                                    name="sms-notifications" 
                                                    type="checkbox" 
                                                    checked={smsNotifications}
                                                    onChange={(e) => setSmsNotifications(e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Security Section */}
                            {activeSection === 'security' && (
                            <div className="bg-surface rounded-3xl p-8 bento-card shadow-card border border-white h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-stone-800">Security</h3>
                                    <span className="material-symbols-outlined text-green-600 text-[24px]">verified_user</span>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <button 
                                        onClick={() => setShowChangePasswordModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-primary hover:bg-white transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-content transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">lock</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-stone-800">Change Password</span>
                                                <span className="block text-xs text-stone-500">Last changed 3 months ago</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowTwoFactorModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-primary hover:bg-white transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-content transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">phonelink_lock</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-stone-800">Two-Factor Auth</span>
                                                <span className="block text-xs text-stone-500">Currently enabled</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:border-primary hover:bg-white transition-all group mt-6"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-content transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-stone-800">Logout</span>
                                                <span className="block text-xs text-stone-500">Sign out of your account</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-stone-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowRemoveAllDataModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50 border border-orange-200 hover:border-orange-300 hover:bg-orange-100 transition-all group mt-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-orange-200 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-orange-900">Remove All Data</span>
                                                <span className="block text-xs text-orange-700">Clear all students, sessions, and earnings</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-orange-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowDeleteAccountModal(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 hover:border-red-300 hover:bg-red-100 transition-all group mt-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-red-200 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">warning</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-red-900">Delete Account</span>
                                                <span className="block text-xs text-red-700">Permanently delete your account and all data</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-red-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Help Center" size="lg">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-stone-50">
                        <h4 className="font-bold text-stone-900 mb-2">Getting Started</h4>
                        <p className="text-sm text-stone-600">Learn how to set up your profile, add students, and schedule your first class.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50">
                        <h4 className="font-bold text-stone-900 mb-2">Managing Students</h4>
                        <p className="text-sm text-stone-600">Add, edit, and track your students' progress and performance.</p>
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={() => setShowHelpModal(false)}
                            className="w-full px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showPhotoUploadModal} onClose={() => setShowPhotoUploadModal(false)} title="Update Profile Photo" size="sm">
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="size-32 rounded-full bg-stone-100 border-4 border-stone-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-stone-400">person</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Upload Photo</label>
                        <input type="file" accept="image/*" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowPhotoUploadModal(false)}
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                createToast('Profile photo updated!', 'success', setToasts);
                                setShowPhotoUploadModal(false);
                            }}
                            className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Upload
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} title="Change Password" size="sm">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Current Password</label>
                        <input name="currentPassword" type="password" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">New Password</label>
                        <input name="newPassword" type="password" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" required minLength={8} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Confirm New Password</label>
                        <input name="confirmPassword" type="password" className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 focus:border-primary focus:ring-primary/20 transition-all" required />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setShowChangePasswordModal(false)}
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Change Password
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showTwoFactorModal} onClose={() => setShowTwoFactorModal(false)} title="Two-Factor Authentication" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">Two-factor authentication is currently enabled. You'll need to enter a code from your authenticator app when signing in.</p>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-600">verified</span>
                            <span className="font-bold text-green-900">Active</span>
                        </div>
                        <p className="text-xs text-green-700">Last used: 2 hours ago</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowTwoFactorModal(false)}
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                createToast('Two-factor authentication settings updated', 'info', setToasts);
                                setShowTwoFactorModal(false);
                            }}
                            className="flex-1 px-4 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Manage
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} title="Delete Account" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.</p>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-xs font-bold text-red-900 mb-1">Warning</p>
                        <p className="text-xs text-red-700">This action is permanent. All your students, sessions, and earnings data will be lost.</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowDeleteAccountModal(false)}
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteAccount}
                            className="flex-1 px-4 py-3 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showRemoveAllDataModal} onClose={() => setShowRemoveAllDataModal(false)} title="Remove All Data" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-stone-600">Are you sure you want to remove all data? This will clear all students, sessions, earnings, and other app data. This action cannot be undone.</p>
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                        <p className="text-xs font-bold text-orange-900 mb-1">Warning</p>
                        <p className="text-xs text-orange-700">This will permanently delete:</p>
                        <ul className="text-xs text-orange-700 mt-2 ml-4 list-disc">
                            <li>All students and their data</li>
                            <li>All scheduled sessions</li>
                            <li>All earnings and transactions</li>
                            <li>All demo data</li>
                        </ul>
                        <p className="text-xs text-orange-700 mt-2">Your profile settings will be reset to defaults.</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowRemoveAllDataModal(false)}
                            className="flex-1 px-4 py-3 rounded-full border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRemoveAllData}
                            className="flex-1 px-4 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-colors"
                        >
                            Remove All Data
                        </button>
                    </div>
                </div>
            </Modal>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};

export default Settings;
