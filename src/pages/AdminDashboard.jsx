import { useState, useEffect } from 'react';
import { getAllUsers, getAllBattles, getAllQuizzes, deleteItem } from '../services/adminService';

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState({ users: [], battles: [], quizzes: [] });
    const [loading, setLoading] = useState(false);

    const checkLogin = (e) => {
        e.preventDefault();
        // MVP Secret Code: "admin123"
        if (password === 'admin123') {
            setIsAuthenticated(true);
            fetchData();
        } else {
            alert('Access Denied');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [u, b, q] = await Promise.all([
                getAllUsers(),
                getAllBattles(),
                getAllQuizzes()
            ]);
            setData({ users: u, battles: b, quizzes: q });
        } catch (error) {
            console.error(error);
            alert("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (collection, id) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteItem(collection, id);
            setData(prev => ({
                ...prev,
                [collection]: prev[collection].filter(item => item.id !== id)
            }));
        } catch (error) {
            alert("Delete failed");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <form onSubmit={checkLogin} className="glass-card p-10 text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="px-4 py-2 border rounded-xl w-full outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold">
                        Enter
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 font-display">Admin Dashboard</h1>

            {/* Navigation */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {['overview', 'users', 'battles', 'quizzes'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-full font-bold capitalize transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        {tab}
                    </button>
                ))}
                <button onClick={fetchData} className="ml-auto text-sm text-gray-500 hover:text-purple-600">
                    🔄 Refresh
                </button>
            </div>

            {loading && <div className="text-center py-10">Loading Data...</div>}

            {!loading && activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 border-l-4 border-blue-500">
                        <h3 className="text-gray-500 mb-1">Total Users</h3>
                        <p className="text-4xl font-bold">{data.users.length}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-green-500">
                        <h3 className="text-gray-500 mb-1">Active Battles</h3>
                        <p className="text-4xl font-bold">{data.battles.length}</p>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-purple-500">
                        <h3 className="text-gray-500 mb-1">Quizzes Created</h3>
                        <p className="text-4xl font-bold">{data.quizzes.length}</p>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'users' && (
                <div className="glass-card p-6 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-gray-500 text-sm">
                                <th className="pb-3">ID</th>
                                <th className="pb-3">Level</th>
                                <th className="pb-3">Coins</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map(u => (
                                <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-3 font-mono text-xs">{u.id}</td>
                                    <td className="py-3">Level {u.level || 1}</td>
                                    <td className="py-3">{u.coins || 0} 🪙</td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleDelete('users', u.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && activeTab === 'battles' && (
                <div className="glass-card p-6 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-gray-500 text-sm">
                                <th className="pb-3">Code</th>
                                <th className="pb-3">Host</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.battles.map(b => (
                                <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-3 font-bold text-indigo-600">{b.code}</td>
                                    <td className="py-3 text-sm">{b.hostId}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'lobby' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleDelete('battles', b.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                                        >
                                            Force Close
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && activeTab === 'quizzes' && (
                <div className="glass-card p-6 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-gray-500 text-sm">
                                <th className="pb-3">Title</th>
                                <th className="pb-3">Created</th>
                                <th className="pb-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.quizzes.map(q => (
                                <tr key={q.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-3 font-bold">
                                        {q.title}
                                        <div className="text-xs text-gray-400 font-normal truncate max-w-[200px]">{q.description}</div>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {q.createdAt?.seconds ? new Date(q.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => handleDelete('quizzes', q.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
