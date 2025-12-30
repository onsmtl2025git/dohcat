import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { createQuiz } from '../services/quizService';
import { getAllUsers, deleteItem } from '../services/adminService';
import AiGeneratorModal from '../components/AiGeneratorModal';

const UnifiedDashboard = ({ role, themeColor }) => {
    const { user } = useUser();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, create, library, users
    const [creationMode, setCreationMode] = useState('manual'); // manual, ai

    // Manual Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('1x'); // 1x, 1.5x, 2x
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Admin State
    const [userList, setUserList] = useState([]);

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
    useEffect(() => {
        if (role === 'Admin' && activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, role]);

    const fetchUsers = async () => {
        const users = await getAllUsers();
        setUserList(users);
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
        setQuestions(newQuestions);
        setCreationMode('manual'); // Switch to manual to review
        alert("✨ Questions generated! Please review and publish.");
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createQuiz({
                title,
                description,
                difficulty,
                questions
            }, user?.uid || 'anon');
            alert("Quiz Published Successfully!");
            setTitle('');
            setDescription('');
            setQuestions([]);
        } catch (error) {
            console.error(error);
            alert("Failed to publish quiz.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            await deleteItem("users", uid);
            fetchUsers(); // Refresh
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
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
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'users' ? `${theme.light} ${theme.text}` : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            👥 Users
                        </button>
                    )}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome back!</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="text-gray-400 text-sm font-bold uppercase mb-2">Total Quizzes</div>
                                <div className="text-4xl font-bold text-gray-800">12</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="text-gray-400 text-sm font-bold uppercase mb-2">Active Students</div>
                                <div className="text-4xl font-bold text-gray-800">24</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="text-gray-400 text-sm font-bold uppercase mb-2">Avg Score</div>
                                <div className="text-4xl font-bold text-gray-800">85%</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && role === 'Admin' && (
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-600">User</th>
                                        <th className="p-4 font-bold text-gray-600">Email</th>
                                        <th className="p-4 font-bold text-gray-600">Role</th>
                                        <th className="p-4 font-bold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map(u => (
                                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                            <td className="p-4 font-bold">{u.username || 'N/A'}</td>
                                            <td className="p-4 text-gray-600">{u.email}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">{u.role || 'User'}</span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">Create New Quiz</h1>
                            <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                <button
                                    onClick={() => setCreationMode('manual')}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition ${creationMode === 'manual' ? `${theme.bg} text-white` : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Manual
                                </button>
                                <button
                                    onClick={() => setShowAiModal(true)}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition ${creationMode === 'ai' ? `${theme.bg} text-white` : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    AI Assistant ✨
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handlePublish} className="space-y-6">
                            {/* Quiz Meta */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 outline-none font-bold"
                                        placeholder="e.g. Physics 101: Forces"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Topic / Description</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 outline-none"
                                            placeholder="Brief description..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-48">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty</label>
                                        <select
                                            value={difficulty}
                                            onChange={e => setDifficulty(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-indigo-600"
                                        >
                                            <option value="1x">🟢 Normal (1x)</option>
                                            <option value="1.5x">🟡 Hard (1.5x)</option>
                                            <option value="2x">🔴 Expert (2x)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Questions Area */}
                            <div className="space-y-4">
                                {questions.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 mb-4">No questions yet.</p>
                                        <button
                                            type="button"
                                            onClick={handleCreateTemplate}
                                            className={`px-6 py-3 ${theme.light} ${theme.text} font-bold rounded-xl hover:opacity-80 transition`}
                                        >
                                            + Generate Blank Templates
                                        </button>
                                    </div>
                                ) : (
                                    questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                                            <div className="flex justify-between mb-4">
                                                <h3 className="font-bold text-gray-400 text-sm uppercase">Question {idx + 1}</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuestions(questions.filter(qt => qt.id !== q.id))}
                                                    className="text-red-400 hover:text-red-500 text-xs font-bold"
                                                >
                                                    DELETE
                                                </button>
                                            </div>

                                            {/* Question Text */}
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={e => handleQuestionChange(q.id, 'text', e.target.value)}
                                                className="w-full mb-2 px-4 py-2 bg-gray-50 rounded-xl font-medium outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition"
                                                placeholder="Enter question text..."
                                                required
                                            />

                                            {/* Image URL Field (Accessibility) */}
                                            <div className="flex gap-2 mb-4">
                                                <span className="text-xl">🖼️</span>
                                                <input
                                                    type="url"
                                                    value={q.image || ''}
                                                    onChange={e => handleQuestionChange(q.id, 'image', e.target.value)}
                                                    className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm font-medium outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition"
                                                    placeholder="Paste Image or GIF URL here (Mandatory for Accessiblity)"
                                                    required
                                                />
                                            </div>

                                            {/* Preview Image */}
                                            {q.image && (
                                                <div className="mb-4 h-32 w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                                                    <img src={q.image} alt="Preview" className="h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`q-${q.id}`}
                                                            checked={q.correctIndex === optIdx}
                                                            onChange={() => handleQuestionChange(q.id, 'correctIndex', optIdx)}
                                                            className="w-4 h-4 text-green-500 focus:ring-green-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={e => handleOptionChange(q.id, optIdx, e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm outline-none border border-transparent focus:bg-white focus:border-indigo-100 transition"
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Publish Bar */}
                            <div className="sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 flex justify-between items-center">
                                <div className="text-sm font-bold text-gray-500">
                                    {questions.length} Questions Ready
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={handleCreateTemplate}
                                        className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                                    >
                                        + Add More
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || questions.length === 0}
                                        className={`px-8 py-2 ${theme.bg} text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading ? 'Publishing...' : 'Publish Quiz 🚀'}
                                    </button>
                                </div>
                            </div>
                        </form>
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
        </div>
    );
};

export default UnifiedDashboard;
