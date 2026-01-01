import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import AuthModal from './AuthModal';

const Layout = () => {
    const { profile, loading } = useUser();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const location = useLocation();

    // Menu Items Configuration with Material Icons
    const MENU_ITEMS = [
        { name: 'Playground', path: '/', matIcon: 'stadia_controller' },
        { name: 'Discuss', path: '/discuss', matIcon: 'chat_bubble' },
        { name: 'Shop', path: '/shop', matIcon: 'shopping_bag' },
        { name: 'Kids', path: '/auth/kid', matIcon: 'child_care' },
        { name: 'Parents', path: '/auth/parent', matIcon: 'shield_person' },
        { name: 'Teacher', path: '/auth/teacher', matIcon: 'school' },
        { name: 'Admin', path: '/auth/admin', matIcon: 'settings' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-body bg-transparent">
            {/* New Floating Navbar */}
            {/* Restored Full-Width Header with New Styles */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/50 shadow-sm animate-slide-down">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">

                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-3d-white border-2 border-white transform group-hover:rotate-12 transition-transform duration-300">
                            L
                        </div>
                        <span className="text-2xl font-black text-gray-800 dark:text-white tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
                            LeoLearn
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2">
                        {MENU_ITEMS.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path
                                        ? 'bg-[var(--color-primary)] text-white shadow-md transform scale-105'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 hover:text-[var(--color-primary)]'
                                    }`}
                            >
                                <span className={`material-symbols-rounded text-lg ${location.pathname === item.path ? 'animate-pulse' : ''}`}>
                                    {item.matIcon}
                                </span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Status */}
                    <div
                        className="flex items-center gap-3 bg-white/50 hover:bg-white/80 dark:bg-gray-800/50 pl-2 pr-4 py-1.5 rounded-full border border-white/60 shadow-sm transition-all cursor-pointer group"
                        onClick={() => setIsAuthModalOpen(true)}
                    >
                        <div className="w-9 h-9 rounded-full bg-yellow-200 border-2 border-yellow-400 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                            {profile?.emojis?.[0] || '🐱'}
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xs font-black text-gray-800 dark:text-white">
                                {profile ? (profile.username || 'Friend') : 'Guest'}
                            </span>
                            <span className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-wider">
                                {profile ? `Lvl ${profile.level || 1}` : 'Login'}
                            </span>
                        </div>
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
