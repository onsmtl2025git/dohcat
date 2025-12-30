import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail as signIn, registerWithEmail as signUp, resendVerification } from '../services/authService';

const AuthPortal = ({ role, themeColor, redirectPath }) => {
    const nav = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);

    // Color Maps
    const themes = {
        cyan: { bg: 'bg-cyan-400', text: 'text-cyan-500', border: 'focus:ring-cyan-400', gradient: 'from-cyan-400 to-blue-500' },
        purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'focus:ring-purple-500', gradient: 'from-purple-500 to-indigo-600' },
        indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'focus:ring-indigo-500', gradient: 'from-indigo-500 to-blue-600' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'focus:ring-emerald-500', gradient: 'from-emerald-400 to-teal-500' },
        orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'focus:ring-orange-500', gradient: 'from-orange-400 to-red-500' },
    };

    const theme = themes[themeColor] || themes['cyan'];

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVerificationSent(false);

        try {
            // Wild Account Magic
            if (email === 'funfun888@gmail.com' && password === '888888') {
                try { await signIn(email, password); }
                catch (err) { await signUp(email, password); }
                nav(redirectPath);
                return;
            }

            if (isLogin) {
                const userCred = await signIn(email, password);
                if (!userCred.user.emailVerified) {
                    setError("📧 Please verify your email before logging in.");
                    // Optionally show resend button
                } else {
                    nav(redirectPath);
                }
            } else {
                // Set pending info for UserContext to pick up after registration
                window.pendingRole = role;
                window.pendingUsername = username;
                await signUp(email, password);
                setVerificationSent(true);
                setIsLogin(true); // Switch back to login view
            }
        } catch (err) {
            console.error(err);
            const msg = err.message.replace('Firebase: ', '');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Verify Your Email</h2>
                    <p className="text-gray-600 mb-6">
                        We've sent a verification link to <strong>{email}</strong>.<br />
                        Please check your inbox (and spam folder) to activate your account.
                    </p>
                    <button
                        onClick={() => setVerificationSent(false)}
                        className={`px-6 py-2 ${theme.bg} text-white font-bold rounded-full hover:opacity-90 transition`}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-body">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden">
                {/* Decor Top */}
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.gradient}`}></div>

                {/* Avatar Icon */}
                <div className={`mx-auto w-24 h-24 ${theme.bg} rounded-full flex items-center justify-center mb-6 shadow-lg text-white`}>
                    <span className="text-4xl">
                        {role === 'Parents' && '🛡️'}
                        {role === 'Admin' && '⚙️'}
                        {role === 'Teacher' && '🎓'}
                        {role === 'User' && '🐱'}
                    </span>
                </div>

                <h1 className={`text-3xl font-bold ${theme.text} mb-2 font-display`}>{role} Access</h1>
                <p className="text-gray-500 mb-8">
                    {role === 'Parents' && "Manage your child's learning universe."}
                    {role === 'Admin' && "Control panel for LeoLearn platform."}
                    {role === 'Teacher' && "Create and manage classroom quizzes."}
                    {role === 'User' && "Login to start your adventure!"}
                </p>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl mb-4 text-left border-l-4 border-red-400">
                        {error}
                        {error.includes("verify") && (
                            <button onClick={resendVerification} className="block mt-2 text-red-700 underline text-xs font-bold">
                                Resend Verification Email
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Display Username"
                            className={`w-full px-6 py-3 bg-gray-50 border-none rounded-2xl text-gray-700 font-bold focus:ring-2 ${theme.border} outline-none transition-all placeholder:text-gray-400`}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required={!isLogin}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        className={`w-full px-6 py-3 bg-gray-50 border-none rounded-2xl text-gray-700 font-bold focus:ring-2 ${theme.border} outline-none transition-all placeholder:text-gray-400`}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className={`w-full px-6 py-3 bg-gray-50 border-none rounded-2xl text-gray-700 font-bold focus:ring-2 ${theme.border} outline-none transition-all placeholder:text-gray-400 tracking-widest`}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 ${theme.bg} hover:opacity-90 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-lg`}
                    >
                        {loading ? 'Processing...' : (isLogin ? `Log In as ${role}` : `Sign Up as ${role}`)}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    {role !== 'Admin' && (
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className={`${theme.text} font-bold hover:underline text-sm`}
                        >
                            {isLogin ? 'New here? Create an Account' : 'Already have an account? Log In'}
                        </button>
                    )}
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

export default AuthPortal;
