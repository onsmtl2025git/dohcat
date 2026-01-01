import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { createQuiz } from '../services/quizService';
import { getAllUsers, deleteItem, updateItem, getAllPosts, getAllQuizzes } from '../services/adminService';
import AiGeneratorModal from '../components/AiGeneratorModal';
import { createUserProfile } from '../services/userService';

const UnifiedDashboard = ({ role, themeColor }) => {
    const { user, profile, loading: userLoading } = useUser();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, create, library, users
    const [creationMode, setCreationMode] = useState('manual'); // manual, ai

    // Manual Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [catpoolImage, setCatpoolImage] = useState('');
    const [difficulty, setDifficulty] = useState('1x'); // 1x, 1.5x, 2x
    const [loading, setLoading] = useState(false);

    // Draft System
    const [draftQuestions, setDraftQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null); // ID of draft question being edited
    const [editingQuizId, setEditingQuizId] = useState(null); // ID of published quiz being "upgraded"
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        image: '',
        options: ['', '', '', ''],
        correctAnswer: 'a' // 'a', 'b', 'c', 'd'
    });

    const [userList, setUserList] = useState([]);
    const [contentList, setContentList] = useState([]); // For Quizzes/Posts
    const [myQuizzes, setMyQuizzes] = useState([]);
    const [ads, setAds] = useState([]); // Admin Ads
    const [announcement, setAnnouncement] = useState(''); // Universal Message

    // AI Modal
    const [showAiModal, setShowAiModal] = useState(false);

    // Color Maps
    const themes = {
        cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
        purple: { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
        orange: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
    };
    const theme = themes[themeColor] || themes['cyan'];

    // --- Effects ---
    // --- Debug Visibility ---
    const [debugInfo, setDebugInfo] = useState({ myRole: '...', targetRole: '...' });
    const [accessDenied, setAccessDenied] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        if (userLoading) return; // Wait for profile

        // Security Check
        if (!user) {
            nav('/');
            return;
        }

        const currentRole = profile?.role;
        setDebugInfo({ myRole: currentRole, targetRole: role });

        // Normalization for comparison
        const normCurrent = String(currentRole || '').toLowerCase().trim();
        const normTarget = String(role || '').toLowerCase().trim();

        // 1. Admin Override: Admin can access ALL dashboards (optional, but usually helpful)
        // For now, we stick to strict separation as requested.

        // 2. Strict Check
        if (normCurrent !== normTarget) {
            console.log(`RBAC BLOCKED: '${normCurrent}' tried to access '${normTarget}'`);
            setAccessDenied(true);
        } else {
            console.log(`RBAC ALLOWED: '${normCurrent}' matches '${normTarget}'`);
            setAccessDenied(false);
        }

    }, [user, profile, userLoading, role, nav]);

    // ... (Access Denied Render Block is here, no change needed) ...

    useEffect(() => {
        // Fetch data if user is loaded. The accessDenied check handles security.
        // We only fetch if NOT denied to avoid wasted calls.
        if (!userLoading && !accessDenied) {
            if (activeTab === 'users' && role === 'Admin') fetchUsers();
            if (activeTab === 'contents' && role === 'Admin') fetchContents();
            if (activeTab === 'create' || activeTab === 'overview') fetchMyQuizzes();
        }
    }, [activeTab, role, profile, userLoading, accessDenied]);

    const fetchUsers = async () => {
        try {
            console.log("Fetching users...");
            const users = await getAllUsers();
            console.log("Users fetched:", users);
            setUserList(users);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert(`Failed to load users: ${error.message}`);
        }
    };

    const fetchContents = async () => {
        try {
            console.log("Fetching contents...");
            const quizzes = await getAllQuizzes();
            const posts = await getAllPosts();
            setContentList({ quizzes, posts });
        } catch (error) {
            console.error("Error fetching contents:", error);
            // alert(`Failed to load contents: ${error.message}`);
        }
    };

    const fetchMyQuizzes = async () => {
        if (!user) return;
        try {
            const quizzes = await getAllQuizzes();
            // Match creatorId from quizService
            setMyQuizzes(quizzes.filter(q => q.creatorId === user.uid));
        } catch (error) {
            console.error("Error fetching my quizzes:", error);
        }
    };

    // --- Actions ---

    const handleCreateTemplate = () => {
        const count = prompt("How many blank questions?", "5");
        if (count && !isNaN(count)) {
            const newQs = Array.from({ length: parseInt(count) }, (_, i) => ({
                id: Date.now() + i,
                text: '',
                image: '', // Image Field
                options: ['', '', '', ''],
                correctIndex: 0
            }));
            setQuestions(prev => [...prev, ...newQs]);
        }
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleOptionChange = (qId, optionIndex, value) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleAiGenerated = (newQuestions) => {
        setDraftQuestions(prev => [...prev, ...newQuestions]);
        setCreationMode('manual'); // Switch to manual to review
        alert("✨ Questions generated! Please review and publish.");
    };

    const handleAddToDraft = () => {
        if (!currentQuestion.text && !currentQuestion.image) {
            alert("Question text or image is required!");
            return;
        }

        if (editingId) {
            // Update existing draft
            setDraftQuestions(draftQuestions.map(q => q.id === editingId ? { ...currentQuestion, id: editingId } : q));
            setEditingId(null);
        } else {
            // Add new draft
            setDraftQuestions([...draftQuestions, { ...currentQuestion, id: Date.now() }]);
        }

        setCurrentQuestion({
            text: '',
            image: '',
            options: ['', '', '', ''],
            correctAnswer: 'a'
        });
    };

    const handleEditDraft = (q) => {
        setEditingId(q.id);
        setCurrentQuestion({
            text: q.text,
            image: q.image,
            options: q.options,
            correctAnswer: q.correctAnswer
        });
    };

    const handleEditPublished = (quiz) => {
        setEditingQuizId(quiz.id);
        setTitle(quiz.title);
        setCatpoolImage(quiz.imageUrl || '');
        // Map quiz format back to draft format
        const reloadedDrafts = quiz.questions.map((q, i) => ({
            id: Date.now() + i,
            text: q.text,
            image: q.image || '',
            options: q.options,
            correctAnswer: ['a', 'b', 'c', 'd'][q.correctIndex]
        }));
        setDraftQuestions(reloadedDrafts);
        alert("Catpool reloaded into builder for editing! ✏️");
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title) return alert("Catpool Name is required!");
        if (draftQuestions.length === 0) return alert("Add at least one question to draft!");

        setLoading(true);
        try {
            await createQuiz({
                title,
                description,
                difficulty,
                imageUrl: catpoolImage,
                // Map draft format to quiz service format
                questions: draftQuestions.map(q => ({
                    text: q.text,
                    image: q.image,
                    options: q.options,
                    correctIndex: ['a', 'b', 'c', 'd'].indexOf(q.correctAnswer)
                }))
            }, user?.uid || 'anon');
            alert("Catpool Published Successfully! 🚀");
            setTitle('');
            setDescription('');
            setCatpoolImage('');
            setDraftQuestions([]);
            fetchMyQuizzes();
        } catch (error) {
            console.error(error);
            alert("Failed to publish catpool.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, setter) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!confirm("Are you sure you want to save these changes to the database?")) return;

        try {
            if (editingUser.id) {
                // Update existing
                await updateItem("users", editingUser.id, editingUser);
            } else {
                // Create new (Manual creation)
                const newId = 'manual_' + Math.floor(100000 + Math.random() * 900000);
                // Ensure we don't pass undefined values
                const userData = {
                    username: editingUser.username || 'New User',
                    email: editingUser.email || 'N/A',
                    role: editingUser.role || 'User',
                    disabled: false
                };
                await createUserProfile(newId, false, userData);
            }
            setShowUserModal(false);
            fetchUsers();
            alert("User saved successfully!");
        } catch (error) {
            console.error(error);
            alert(`Failed to save user: ${error.message}`);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            await deleteItem("users", uid);
            fetchUsers(); // Refresh
        }
    };

    // --- Access Denied Render ---
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] shadow-xl p-12 max-w-lg text-center border-t-8 border-red-500">
                    <div className="text-6xl mb-6">🛑</div>
                    <h1 className="text-3xl font-black text-gray-800 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 font-medium mb-8">
                        You are logged in as a <span className="text-indigo-600 font-bold">{profile?.role || 'User'}</span>,
                        but you are trying to access the <span className="text-red-500 font-bold">{role} Dashboard</span>.
                    </p>

                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-8">
                        Strict role enforcement is active. Please return to your designated area.
                    </div>

                    <button
                        onClick={() => {
                            const roleMap = {
                                'Admin': '/admin',
                                'Teacher': '/teacher',
                                'Parents': '/parent',
                                'Kid': '/kid'
                            };
                            const correctPath = roleMap[profile?.role] || '/';
                            nav(correctPath);
                        }}
                        className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg hover:bg-black transition transform active:scale-95"
                    >
                        Go to My Dashboard ➜
                    </button>
                </div>
            </div>
        );
    }

    // --- Access Disabled / Pending Render ---
    if (profile?.disabled) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] shadow-xl p-12 max-w-lg text-center border-t-8 border-gray-400">
                    <div className="text-6xl mb-6">⏳</div>
                    <h1 className="text-3xl font-black text-gray-800 mb-2">Account Pending</h1>
                    <p className="text-gray-500 font-medium mb-8">
                        Your account is currently <span className="text-red-500 font-bold">Inactive</span>.
                        {profile?.role === 'Admin' && <br />}
                        {profile?.role === 'Admin' && "New Admin accounts require approval from an existing Administrator."}
                    </p>

                    <div className="bg-orange-50 text-orange-600 p-4 rounded-xl text-sm font-bold mb-8">
                        Please contact an Administrator to activate your account.
                    </div>

                    <button
                        onClick={async () => {
                            const { logout } = await import('../services/authService');
                            await logout();
                            nav('/');
                        }}
                        className="w-full py-4 bg-gray-200 text-gray-600 font-black rounded-2xl shadow-sm hover:bg-gray-300 transition"
                    >
                        Log Out 🚪
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex gap-6 p-6">
            {/* Sidebar - Now Floating & Rounded */}
            <aside className="w-72 glass-panel rounded-[2.5rem] border border-white/50 hidden md:flex flex-col shadow-xl h-[calc(100vh-3rem)] sticky top-6 overflow-hidden">
                <div className="p-6">
                    <h2 className={`text-2xl font-bold ${theme.text} mb-1`}>{role} Panel</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dashboard</p>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'overview' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        📊 Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'create' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        ✏️ Create Quiz
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'library' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        📚 Library
                    </button>
                    {role === 'Admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'users' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                👥 Users
                            </button>
                            <button
                                onClick={() => setActiveTab('contents')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'contents' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                📦 Contents
                            </button>
                            <button
                                onClick={() => setActiveTab('rewards')}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'rewards' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                🏆 Rewards
                            </button>
                        </>
                    )}
                </nav>

                {/* User Identity Section */}
                <div className="p-4 border-t border-white/50">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl shadow-sm">
                            {profile?.emojis?.[0] || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate">{profile?.username || 'Kid'}</h4>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                {profile?.role || 'Guest'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            const { logout } = await import('../services/authService');
                            await logout();
                            nav('/');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition text-xs"
                    >
                        🚪 Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto rounded-[2.5rem] scroll-smooth no-scrollbar">
                {activeTab === 'overview' && (
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 mb-6 drop-shadow-sm">Welcome back!</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="floating-card bg-[var(--color-card-cyan)] dark:bg-cyan-900 text-white p-6 rounded-[2rem] shadow-3d-cyan border-2 border-white/20 relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="text-white/80 text-sm font-black uppercase mb-2">Total Quizzes</div>
                                    <div className="text-5xl font-black">12</div>
                                </div>
                            </div>
                            <div className="floating-card bg-[var(--color-card-purple)] dark:bg-purple-900 text-white p-6 rounded-[2rem] shadow-3d-purple border-2 border-white/20 relative overflow-hidden group">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="text-white/80 text-sm font-black uppercase mb-2">Active Students</div>
                                    <div className="text-5xl font-black">24</div>
                                </div>
                            </div>
                            <div className="floating-card bg-[var(--color-card-orange)] dark:bg-orange-800 text-white p-6 rounded-[2rem] shadow-3d-orange border-2 border-white/20 relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="text-white/80 text-sm font-black uppercase mb-2">Avg Score</div>
                                    <div className="text-5xl font-black">85%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && role === 'Admin' && (
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-800">
                                User Management
                                <span className="ml-4 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {userList.length} Accounts
                                </span>
                            </h1>
                            <button
                                onClick={fetchUsers}
                                className="px-4 py-2 bg-white/50 text-gray-700 font-bold rounded-xl hover:bg-white transition text-sm flex items-center gap-2 shadow-sm border border-white/60"
                            >
                                🔄 Refresh List
                            </button>
                        </div>
                        <div className="glass-panel rounded-[2rem] shadow-lg border-2 border-white/50 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/50 border-b border-gray-100/50 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-600">User</th>
                                        <th className="p-4 font-bold text-gray-600">Email</th>
                                        <th className="p-4 font-bold text-gray-600">Role</th>
                                        <th className="p-4 font-bold text-gray-600">Status</th>
                                        <th className="p-4 font-bold text-gray-600 text-right">
                                            <button
                                                onClick={() => {
                                                    setEditingUser({ username: '', email: '', role: 'User' }); // Empty for new
                                                    setShowUserModal(true);
                                                }}
                                                className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-indigo-600 transition shadow-md"
                                            >
                                                + Add Account
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map(u => (
                                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 font-bold">
                                                    <span>{u.username || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'Admin' ? 'bg-purple-100 text-purple-600' :
                                                    u.role === 'Teacher' ? 'bg-blue-100 text-blue-600' :
                                                        u.role === 'Parents' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {u.role || 'User'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.disabled ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {u.disabled ? 'Disabled' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {u.disabled ? (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Approve access for ${u.username}?`)) {
                                                                    await updateItem("users", u.id, { disabled: false });
                                                                    fetchUsers();
                                                                }
                                                            }}
                                                            className="text-green-500 hover:text-green-700 font-bold text-xs bg-green-50 px-2 py-1 rounded"
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Are you sure you want to DISABLE ${u.username}? They will be locked out.`)) {
                                                                    await updateItem("users", u.id, { disabled: true });
                                                                    fetchUsers();
                                                                }
                                                            }}
                                                            className="text-orange-500 hover:text-orange-700 font-bold text-xs bg-orange-50 px-2 py-1 rounded"
                                                        >
                                                            🚫 Block
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(u);
                                                            setShowUserModal(true);
                                                        }}
                                                        className="text-indigo-500 hover:text-indigo-700 font-bold text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'contents' && role === 'Admin' && (
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quizzes (Catpools)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {contentList.quizzes?.map(q => (
                                    <div key={q.id} className="glass-panel p-4 rounded-2xl shadow-sm border border-white/50 group hover:scale-[1.02] transition-transform duration-300">
                                        <h3 className="font-bold text-gray-800 mb-1">{q.title}</h3>
                                        <p className="text-xs text-gray-400 mb-4 truncate">{q.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${q.disabled ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                {q.disabled ? 'HIDDEN' : 'LIVE'}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={async () => { await updateItem("quizzes", q.id, { disabled: !q.disabled }); fetchContents(); }} className="text-xs font-bold text-gray-500 italic">Toggle</button>
                                                <button onClick={async () => { if (confirm("Delete quiz?")) { await deleteItem("quizzes", q.id); fetchContents(); } }} className="text-xs font-bold text-red-400">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Discussion Posts</h2>
                            <div className="glass-panel rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                                <table className="w-full text-left font-medium">
                                    <thead className="bg-white/50 border-b border-gray-100/50 backdrop-blur-sm text-xs text-gray-400 uppercase">
                                        <tr>
                                            <th className="p-4">Post Title</th>
                                            <th className="p-4">Author</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contentList.posts?.map(p => (
                                            <tr key={p.id} className="border-b border-white/30 hover:bg-white/40 transition">
                                                <td className="p-4 text-sm font-bold text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        {p.isPinned && <span className="text-yellow-500">📌</span>}
                                                        {p.title}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">{p.authorName}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={async () => { await updateItem("posts", p.id, { isPinned: !p.isPinned }); fetchContents(); }} className="text-indigo-400 font-bold text-xs">Toggle Pin</button>
                                                        <button onClick={async () => { if (confirm("Delete post?")) { await deleteItem("posts", p.id); fetchContents(); } }} className="text-red-400 font-bold text-xs">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rewards' && role === 'Admin' && (
                    <div className="max-w-4xl mx-auto space-y-8 font-body">
                        {/* Universal Announcement Setting */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">📢 Universal Announcement</h2>
                            <p className="text-indigo-100 mb-6 text-sm font-bold">This message will appear at the top of every page for all users.</p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter announcement text..."
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/50"
                                    value={announcement}
                                    onChange={e => setAnnouncement(e.target.value)}
                                />
                                <button
                                    onClick={() => alert("Announcement Published! (Mock)")}
                                    className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition"
                                >
                                    PUBLISH
                                </button>
                            </div>
                        </div>

                        {/* Rewarding System Section */}
                        <div className="glass-panel p-8 rounded-3xl shadow-sm border border-white/50">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">User Rewards (RP)</h2>
                            <div className="space-y-4">
                                {userList.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl group border border-white/50 hover:shadow-md transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                                                {u.emojis?.[0] || '🐱'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{u.username || 'N/A'}</div>
                                                <div className="text-xs font-black text-indigo-500 uppercase">{u.coins || 0} RP</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    const amount = parseInt(prompt("Amount to ADD?", "10"));
                                                    if (!isNaN(amount)) {
                                                        await updateItem("users", u.id, { coins: (u.coins || 0) + amount });
                                                        fetchUsers();
                                                    }
                                                }}
                                                className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-xs shadow-sm hover:scale-105 transition"
                                            >
                                                + ADD RP
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const amount = parseInt(prompt("Amount to DEDUCT?", "10"));
                                                    if (!isNaN(amount)) {
                                                        await updateItem("users", u.id, { coins: Math.max(0, (u.coins || 0) - amount) });
                                                        fetchUsers();
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-400 text-white font-bold rounded-xl text-xs shadow-sm hover:scale-105 transition"
                                            >
                                                - DEDUCT
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Advertising Management Section */}
                        <div className="glass-panel p-8 rounded-3xl shadow-sm border border-white/50">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Forum Advertisements</h2>
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-white/40 bg-white/30 rounded-2xl p-6 text-center">
                                    <p className="text-gray-400 text-sm font-bold mb-4">No active ads. Add a new banner!</p>
                                    <button className="px-6 py-2 bg-white text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm">+ Create Ad</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* COLUMN 1: Dashboard */}
                        <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-[2rem] shadow-sm border border-white/50">
                                <h3 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                                    📊 Dashboard
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100">
                                        <div className="text-xs font-bold text-cyan-600 uppercase">Total Drafts</div>
                                        <div className="text-2xl font-black text-cyan-700">{draftQuestions.length}</div>
                                    </div>
                                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                                        <div className="text-xs font-bold text-purple-600 uppercase">My Catpools</div>
                                        <div className="text-2xl font-black text-purple-700">{myQuizzes.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="floating-card bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] text-white shadow-3d-purple border-2 border-white/20">
                                <h4 className="font-bold mb-2">Pro Tip! 💡</h4>
                                <p className="text-sm opacity-90">Adding images to your questions makes them 3x more engaging for students!</p>
                            </div>
                        </div>

                        {/* COLUMN 2-3: Manual Builder */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass-panel p-8 rounded-[2.5rem] shadow-lg border-2 border-white/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl -z-10"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-gray-800">Manual Builder</h2>
                                    <button
                                        onClick={() => setShowAiModal(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full text-xs shadow-md hover:scale-105 transition border-2 border-white/20"
                                    >
                                        AI ASSISTANT ✨
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Catpool Meta */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase ml-2">Catpool Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter title..."
                                                className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-cyan-100 outline-none"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-2">
                                                <label className="text-xs font-black text-gray-400 uppercase">Catpool Image</label>
                                                <label className="text-[10px] font-bold text-indigo-500 cursor-pointer hover:underline">
                                                    📎 Upload Local
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setCatpoolImage)} />
                                                </label>
                                            </div>
                                            <input
                                                type="url"
                                                placeholder="Paste image URL or upload above..."
                                                className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-cyan-100 outline-none"
                                                value={catpoolImage}
                                                onChange={e => setCatpoolImage(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <hr className="border-gray-50" />

                                    {/* New Question Section */}
                                    <div className="bg-white/40 p-6 rounded-3xl border border-white/50 space-y-4">
                                        <h3 className="text-sm font-black text-gray-400 uppercase">
                                            {editingId ? "✏️ Edit Question" : "New Question"}
                                        </h3>

                                        <div className="space-y-4">
                                            <textarea
                                                placeholder="Question Text..."
                                                className="w-full px-5 py-3 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-cyan-100 outline-none shadow-sm h-24"
                                                value={currentQuestion.text}
                                                onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                            />

                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center px-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase">Question Image (Optional)</label>
                                                    <label className="text-[10px] font-bold text-indigo-500 cursor-pointer hover:underline">
                                                        📎 Local File
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, (val) => setCurrentQuestion({ ...currentQuestion, image: val }))} />
                                                    </label>
                                                </div>
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL or upload..."
                                                    className="w-full px-5 py-3 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-cyan-100 outline-none shadow-sm text-sm"
                                                    value={currentQuestion.image}
                                                    onChange={e => setCurrentQuestion({ ...currentQuestion, image: e.target.value })}
                                                />
                                            </div>

                                            {/* Options */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {['a', 'b', 'c', 'd'].map((letter, idx) => (
                                                    <div key={letter} className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-50">
                                                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-white ${['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400'][idx]}`}>
                                                            {letter.toUpperCase()}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${letter.toUpperCase()}...`}
                                                            className="flex-1 border-none focus:ring-0 font-bold bg-transparent"
                                                            value={currentQuestion.options[idx]}
                                                            onChange={e => {
                                                                const newOptions = [...currentQuestion.options];
                                                                newOptions[idx] = e.target.value;
                                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Row for Correct Answer and Difficulty */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Correct Answer</label>
                                                    <select
                                                        className="w-full px-4 py-2 bg-white rounded-xl border-none shadow-sm font-bold text-gray-700 focus:ring-2 focus:ring-cyan-100"
                                                        value={currentQuestion.correctAnswer}
                                                        onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                                                    >
                                                        <option value="a">Option A</option>
                                                        <option value="b">Option B</option>
                                                        <option value="c">Option C</option>
                                                        <option value="d">Option D</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Difficulty</label>
                                                    <select
                                                        className="w-full px-4 py-2 bg-white rounded-xl border-none shadow-sm font-bold text-gray-700 focus:ring-2 focus:ring-cyan-100"
                                                        value={difficulty}
                                                        onChange={e => setDifficulty(e.target.value)}
                                                    >
                                                        <option value="1x">Normal (1x)</option>
                                                        <option value="1.5x">Hard (1.5x)</option>
                                                        <option value="2x">Expert (2x)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleAddToDraft}
                                                className={`w-full py-4 ${editingId ? 'bg-indigo-600' : 'bg-gray-800'} text-white font-black rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-95`}
                                            >
                                                {editingId ? "SAVE CHANGES ✅" : "ADD TO DRAFT 📥"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Draft List */}
                                    {draftQuestions.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-black text-gray-400 uppercase">Draft Questions ({draftQuestions.length})</h3>
                                                <button onClick={() => setDraftQuestions([])} className="text-xs font-bold text-red-400 hover:text-red-500">Clear All</button>
                                            </div>
                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {draftQuestions.map((q, i) => (
                                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400">{i + 1}</div>
                                                        <div className="flex-1 flex flex-col min-w-0">
                                                            <p className="font-bold text-gray-700 truncate">{q.text}</p>
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase">Option {q.correctAnswer.toUpperCase()} correct</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditDraft(q)}
                                                                className="text-xs font-bold text-indigo-400 hover:text-indigo-600"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setDraftQuestions(draftQuestions.filter(dq => dq.id !== q.id))}
                                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Final Publish Button */}
                                    <button
                                        onClick={handlePublish}
                                        disabled={loading || draftQuestions.length === 0}
                                        className={`w-full py-5 ${theme.bg} text-white font-black text-xl rounded-[2rem] shadow-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading ? 'PUBLISHING...' : 'PUBLISH CATPOOL 🚀'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 4: My Catpools */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
                                <h3 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                                    🐾 My Catpools
                                </h3>
                                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {myQuizzes.length > 0 ? myQuizzes.map((quiz) => (
                                        <div key={quiz.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-cyan-200 transition-colors group cursor-pointer">
                                            <div className="flex items-center gap-3 mb-2">
                                                {quiz.imageUrl ? (
                                                    <img src={quiz.imageUrl} className="w-10 h-10 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center text-xl">🐱</div>
                                                )}
                                                <div className="flex-1">
                                                    <h4 className="font-black text-gray-800 text-sm truncate">{quiz.title}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{quiz.difficulty || '1x'}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">LIVE</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditPublished(quiz)} className="text-[10px] font-bold text-indigo-500 hover:underline">Edit/Upgrade</button>
                                                    <button className="text-[10px] font-bold text-gray-400 hover:text-red-500">Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10">
                                            <div className="text-4xl mb-2">🔭</div>
                                            <p className="text-xs text-gray-400 font-bold">No catpools yet. Start building!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="text-center py-20 text-gray-400">Library Module Coming Soon...</div>
                )}
            </main>

            <AiGeneratorModal
                isOpen={showAiModal}
                onClose={() => setShowAiModal(false)}
                onGenerate={handleAiGenerated}
            />
            {/* User Edit/Add Modal */}
            {showUserModal && editingUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-800 mb-6">{editingUser.id ? 'Edit Account' : 'Add New Account'}</h2>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Username</label>
                                <input
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={editingUser.username || ''}
                                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={editingUser.email || ''}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={editingUser.role || 'Kid'}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="Kid">Kid</option>
                                    <option value="Parents">Parents</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            {/* Disabled Status Toggle */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="text-sm font-bold text-gray-500">Account Status:</label>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser({ ...editingUser, disabled: !editingUser.disabled })}
                                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${editingUser.disabled ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}
                                >
                                    {editingUser.disabled ? 'Disabled' : 'Active'}
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="px-6 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-indigo-500 text-white font-black rounded-xl hover:bg-indigo-600 transition shadow-lg shadow-indigo-200"
                                >
                                    Update Database
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedDashboard;
