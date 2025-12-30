import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { loginWithEmail as signIn, registerWithEmail as signUp } from '../services/authService';

const GuardianAuth = () => {
    const nav = useNavigate();
    const { user } = useUser();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Wild Account Magic
            if (email === 'funfun888@gmail.com' && password === '888888') {
                // Determine if we need to sign up or sign in this user real quick
                // For MVP, we'll try sign in, if fail, sign up.
                try {
                    await signIn(email, password);
                } catch (err) {
                    await signUp(email, password);
                }
            } else {
                if (isLogin) {
                    await signIn(email, password);
                } else {
                    await signUp(email, password);
                }
            }

            // Redirect based on intent (default to parent dashboard)
            nav('/parent');
        } catch (err) {
            console.error(err);
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-body">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
                {/* Decor Top */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>

                {/* Avatar Icon */}
                <div className="mx-auto w-24 h-24 bg-cyan-400 rounded-full flex items-center justify-center mb-6 shadow-lg text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A7.5 7.5 0 014.501 20.118z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-cyan-500 mb-2 font-display">Guardian Access</h1>
                <p className="text-gray-500 mb-8">Manage your child's learning universe.</p>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl mb-4 text-left">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-11 pr-4 py-3 bg-blue-50 border-none rounded-2xl text-gray-700 font-bold focus:ring-2 focus:ring-cyan-400 outline-none transition-all placeholder:text-gray-400"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-11 pr-4 py-3 bg-blue-50 border-none rounded-2xl text-gray-700 font-bold focus:ring-2 focus:ring-cyan-400 outline-none transition-all placeholder:text-gray-400 tracking-widest"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-cyan-400 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? 'Accessing...' : (isLogin ? 'Access Portal 🔑' : 'Create Account ✨')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-cyan-600 font-bold hover:underline text-sm"
                    >
                        {isLogin ? 'New here? Create a Parent Account' : 'Already have an account? Log In'}
                    </button>
                    <div className="mt-2">
                        <a href="#" className="text-gray-400 text-sm">Forgot Password?</a>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={() => nav('/')} className="px-6 py-2 bg-gray-50 rounded-full text-gray-400 text-sm font-bold hover:bg-gray-100 transition">
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuardianAuth;
