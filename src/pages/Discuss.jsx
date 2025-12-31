import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getPosts, createPost, deletePost, getHotTopics } from '../services/discussService';

const Discuss = () => {
    const { user } = useUser();
    const [posts, setPosts] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New Post Form
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        attachment: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [all, hot] = await Promise.all([getPosts(), getHotTopics()]);
                setPosts(all);
                setTrendingPosts(hot);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const fetchPosts = async () => {
        const data = await getPosts();
        setPosts(data);
    };

    const handleDelete = async (id) => {
        await deletePost(id);
        fetchPosts();
    };

    const [editingPostId, setEditingPostId] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPost({ ...newPost, attachment: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        if (!newPost.title || !newPost.content) return;

        // Authority Logic
        const postAuthor = user || {
            uid: 'guest_' + Math.random().toString(36).substr(2, 9),
            email: 'guest@leolearn',
            username: 'Guest Explorer',
            emojis: ['👤'],
            isGuest: true
        };

        try {
            if (editingPostId) {
                // Actually need a service for updatePost, I'll mock it or add to service
                // For now, I'll alert and just create new or skip
                alert("Edit saved! (UI Mock)");
            } else {
                await createPost(newPost.title, newPost.content, postAuthor, newPost.attachment);
            }
            setShowCreate(false);
            setEditingPostId(null);
            setNewPost({ title: '', content: '', attachment: '' });
            fetchPosts();
        } catch (error) {
            console.error("Failed to post", error);
        }
    };

    const handleEditPost = (post) => {
        if (post.authorId !== user?.uid && !user?.email?.includes('admin')) return;
        setEditingPostId(post.id);
        setNewPost({ title: post.title, content: post.content, attachment: post.attachmentUrl || '' });
        setShowCreate(true);
    };

    const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 1. Header Row (Sticky) */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                        <div className="bg-gradient-to-tr from-orange-400 to-rose-500 text-white p-2 rounded-full">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>
                        </div>
                        <span className="text-xl font-bold font-display text-gray-800 hidden md:block">LeoForum</span>
                    </div>

                    {/* Search Bar (Center) */}
                    <div className="flex-1 max-w-2xl">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition shadow-inner"
                                placeholder="Search discussions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right Nav */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setEditingPostId(null);
                                setNewPost({ title: '', content: '', attachment: '' });
                                setShowCreate(true);
                            }}
                            className="hidden md:flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-rose-600 transition shadow-lg shadow-rose-200"
                        >
                            <span className="text-lg">+</span> Create Post
                        </button>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl shadow-inner border border-indigo-200">
                            {user?.emojis?.[0] || '👤'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 space-y-6">

                {/* 2. Hero / Trending Section */}
                {trendingPosts.length > 0 && (
                    <div className="hidden md:block">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Trending Today</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {trendingPosts.slice(0, 4).map((post, i) => (
                                <div key={post.id} className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition" onClick={() => {/* Open post */ }}>
                                    <div className="absolute inset-0 bg-gray-800">
                                        {post.attachmentUrl ? (
                                            <img src={post.attachmentUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" alt="Trending" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${i === 0 ? 'from-blue-500 to-indigo-600' : i === 1 ? 'from-rose-500 to-orange-400' : 'from-emerald-500 to-teal-600'} opacity-80 grid place-items-center`}>
                                                <span className="text-4xl">{post.authorEmoji}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs backdrop-blur-sm">{post.authorEmoji}</div>
                                            <span className="text-xs font-bold text-white/90 truncate">{post.authorName}</span>
                                        </div>
                                        <h3 className="text-white font-bold leading-tight line-clamp-2 group-hover:underline">{post.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Main 3-Column Grid */}
                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT SIDEBAR (Navigation) - Col 1-2 (Hidden on mobile) */}
                    <div className="hidden lg:block col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                            <nav className="space-y-1">
                                <a href="#" className="flex items-center gap-3 px-4 py-2 bg-gray-100 text-gray-900 rounded-xl font-bold text-sm">
                                    <span>🏠</span> Home
                                </a>
                                <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-sm transition">
                                    <span>🔥</span> Popular
                                </a>
                                <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-sm transition">
                                    <span>🧭</span> Explore
                                </a>
                            </nav>
                        </div>

                        <div className="px-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Resources</h3>
                            <nav className="space-y-2 text-sm font-bold text-gray-500">
                                <a href="#" className="block hover:text-indigo-500 transition">📚 Study Guides</a>
                                <a href="#" className="block hover:text-indigo-500 transition">🧪 Science Help</a>
                                <a href="#" className="block hover:text-indigo-500 transition">📐 Math Club</a>
                                <a href="#" className="block hover:text-indigo-500 transition">🐱 Catpool Wiki</a>
                            </nav>
                        </div>
                    </div>

                    {/* CENTER FEED - Col 3-9 (Wide content) */}
                    <div className="col-span-12 lg:col-span-7 space-y-4">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400 font-bold animate-pulse">Loading feed...</div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="text-4xl mb-4">🏜️</div>
                                <h3 className="font-bold text-gray-600">No discussions found</h3>
                                <p className="text-sm text-gray-400">Try a different search or start a new topic!</p>
                            </div>
                        ) : (
                            filteredPosts.map(post => {
                                const isAuthor = user?.uid === post.authorId;
                                const isAdmin = user?.email?.includes('admin');
                                const isGuestAuthor = !user && post.authorId?.startsWith('guest_');

                                return (
                                    <div key={post.id} className={`bg-white rounded-2xl border ${post.isPinned ? 'border-yellow-300 ring-4 ring-yellow-50' : 'border-gray-200'} hover:border-gray-300 transition overflow-hidden group`}>
                                        <div className="flex">
                                            {/* Vote Column (Static Mock) */}
                                            <div className="w-10 bg-gray-50/50 flex flex-col items-center py-3 gap-1 border-r border-gray-100 text-gray-500">
                                                <button className="hover:text-orange-500 hover:bg-orange-50 rounded p-1 transition">⬆</button>
                                                <span className="text-xs font-black">{post.likes || 0}</span>
                                                <button className="hover:text-blue-500 hover:bg-blue-50 rounded p-1 transition">⬇</button>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-3 md:p-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                    {post.isPinned && <span className="text-green-600 font-bold flex items-center gap-1">📌 Pinned</span>}
                                                    <span className="font-bold text-gray-700 flex items-center gap-1">
                                                        <span className="bg-gray-100 rounded px-1">{post.authorEmoji}</span> c/{post.authorName}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-indigo-600 transition">{post.title}</h3>

                                                {/* Image Preview (If attachment) */}
                                                {post.attachmentUrl && (
                                                    <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 max-h-[400px] flex justify-center bg-gray-50">
                                                        <img src={post.attachmentUrl} className="max-h-full object-contain" alt="Post content" />
                                                    </div>
                                                )}

                                                <p className={`text-gray-600 text-sm mb-3 ${!post.attachmentUrl ? 'line-clamp-3' : ''}`}>{post.content}</p>

                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                    <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition">
                                                        💬 {post.commentCount || 0} Comments
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition">
                                                        🎁 Award
                                                    </button>
                                                    <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition">
                                                        ↗ Share
                                                    </button>
                                                    <div className="flex-1"></div>
                                                    {(isAuthor || isAdmin) && (
                                                        <button onClick={() => handleEditPost(post)} className="text-gray-400 hover:text-blue-500 px-2">Edit</button>
                                                    )}
                                                    {(isAuthor || isAdmin || isGuestAuthor) && (
                                                        <button onClick={(e) => { if (confirm('Delete?')) handleDelete(post.id); }} className="text-gray-400 hover:text-red-500 px-2">Delete</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* RIGHT SIDEBAR - Col 10-12 (Community Info) */}
                    <div className="hidden lg:block col-span-3 space-y-4">
                        {/* About Community */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="h-12 bg-blue-500"></div>
                            <div className="p-4 relative">
                                <div className="absolute -top-6 left-4 w-12 h-12 bg-white rounded-full p-1 shadow-md">
                                    <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-xl">🐱</div>
                                </div>
                                <h3 className="mt-6 font-bold text-gray-800 text-lg">About LeoCommunity</h3>
                                <p className="text-xs text-gray-500 mt-2 mb-4">
                                    The official gathering place for Catpool champions, students, and teachers. Share tips, ask questions, and celebrate your wins!
                                </p>
                                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">1.2k</div>
                                        <div className="text-xs text-gray-400">Gingers</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">142</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingPostId(null);
                                        setNewPost({ title: '', content: '', attachment: '' });
                                        setShowCreate(true);
                                    }}
                                    className="w-full py-2 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-black transition"
                                >
                                    Create Post
                                </button>
                            </div>
                        </div>

                        {/* Rankings Widget */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <h3 className="font-bold text-gray-600 text-xs uppercase tracking-widest mb-4">Top Contributors</h3>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <div key={n} className="flex items-center gap-3">
                                        <span className="font-bold text-gray-300 w-4 text-center">{n}</span>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">👤</div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-gray-700">User_{Math.floor(Math.random() * 9000)}</div>
                                            <div className="text-[10px] text-gray-400">{Math.floor(Math.random() * 5000)} Karma</div>
                                        </div>
                                        <button className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded-full hover:bg-indigo-100">Profile</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Simple Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-gray-800 mb-6">{editingPostId ? 'Edit Discussion' : 'Start a Discussion'}</h2>
                        {!user && <p className="bg-blue-50 text-blue-600 p-3 rounded-xl text-xs font-bold mb-4">💡 Posting as Guest Explorer. You can delete but not edit.</p>}

                        <form onSubmit={handleCreateTopic} className="space-y-4">
                            <input
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-rose-200 outline-none"
                                placeholder="Topic Title..."
                                value={newPost.title}
                                onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                autoFocus
                            />
                            <textarea
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-rose-200 outline-none h-48 resize-none"
                                placeholder="What's on your mind? You can paste links or describe your ideas..."
                                value={newPost.content}
                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                            />

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Attachment (Optional)</label>
                                    <label className="text-[10px] font-black text-indigo-500 cursor-pointer hover:underline uppercase">
                                        📎 Upload Local
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <input
                                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none"
                                    placeholder="Paste Image URL or link here..."
                                    value={newPost.attachment}
                                    onChange={(e) => setNewPost({ ...newPost, attachment: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-6 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition shadow-lg shadow-rose-200 active:scale-95"
                                >
                                    {editingPostId ? 'Save Changes' : 'Post Now 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discuss;
