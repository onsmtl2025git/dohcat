import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import AuthModal from './AuthModal';

const Layout = () => {
    const { profile, loading } = useUser();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const location = useLocation();

    // Menu Items Configuration
    const MENU_ITEMS = [
        { name: 'Play Ground', path: '/', icon: '🎮' },
        { name: 'Discuss', path: '/discuss', icon: '🗨️' },
        { name: 'Shop', path: '/shop', icon: '🛍️' },
        { name: 'Kids', path: '/auth/kid', icon: '👤' },
        { name: 'Parents', path: '/auth/parent', icon: '🛡️' },
        { name: 'Teacher', path: '/auth/teacher', icon: '🎓' },
        { name: 'Admin', path: '/auth/admin', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-body text-gray-700 bg-[var(--color-leo-bg)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Header - White & Clean per reference */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                {/* Announcement Banner (Universal Message) */}
                <div id="universal-announcement" className="hidden bg-indigo-600 text-white py-2 text-center text-xs font-bold animate-pulse">
                    🚀 New Feature Alert: Check out the upgraded Cats Playground!
                </div>
                <div className="container mx-auto px-4 h-20 flex justify-between items-center">

                    {/* Logo Area */}
                    <Link to="/" className="flex items-center gap-2 group">
                        {/* Custom Logo Box - Cyan 'L' */}
                        <div className="w-10 h-10 bg-[var(--color-leo-primary)] rounded-xl flex items-center justify-center text-white font-bold text-2xl font-display shadow-sm group-hover:scale-105 transition-transform">
                            L
                        </div>
                        <span className="text-2xl font-bold text-[var(--color-leo-primary)] font-display tracking-tight hover:opacity-90 transition-opacity">
                            LeoLearn
                        </span>
                    </Link>

                    {/* Navigation - Centered Items */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {MENU_ITEMS.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-2 font-bold transition-colors ${location.pathname === item.path
                                    ? 'text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-xl opacity-80">{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile Pill - REMOVED per user request */}
                    <div className="flex items-center gap-4">
                        {/* Status removed. Identity is now in Sidebar only. */}
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <Outlet />
            </main>

            <footer className="glass-panel mt-auto py-6 border-t border-white/60">
                {/* Simplified Footer as Links moved to Header */}
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm font-medium gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🐱</span>
                        <span>LeoLearn</span>
                    </div>

                    <div className="flex gap-4 opacity-80">
                        <Link to="/about" className="hover:text-gray-800">About</Link>
                        <Link to="/contact" className="hover:text-gray-800">Contact</Link>
                        <Link to="/parent" className="hover:text-gray-800">Parents</Link>
                        <Link to="/admin" className="hover:text-gray-800">Admin</Link>
                    </div>

                    <div>
                        &copy; {new Date().getFullYear()} LeoLearn. Made with 💜 for everyone.
                    </div>
                </div>
            </footer>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default Layout;
