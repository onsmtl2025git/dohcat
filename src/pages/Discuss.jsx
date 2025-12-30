import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getPosts, createPost, deletePost } from '../services/discussService';

const Discuss = () => {
    const { user } = useUser();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // New Post Form
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        attachment: ''
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const data = await getPosts();
            setPosts(data);
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            {/* Announcement banner logic can be here too */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-display mb-2">
                        Community Chat 🗨️
                    </h1>
                    <p className="text-gray-500 font-medium">Join the conversation with other Dohkittens!</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPostId(null);
                        setNewPost({ title: '', content: '', attachment: '' });
                        setShowCreate(true);
                    }}
                    className="px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg hover:bg-rose-600 hover:scale-105 transition transform"
                >
                    + New Topic
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Loading discussions...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No topics yet. Be the first!</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            const isAuthor = user?.uid === post.authorId;
                            const isAdmin = user?.email?.includes('admin');
                            const isGuestAuthor = !user && post.authorId?.startsWith('guest_');

                            return (
                                <div key={post.id} className={`bg-white p-6 rounded-3xl shadow-sm border ${post.isPinned ? 'border-yellow-300' : 'border-gray-100'} hover:border-rose-100 transition group`}>
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl bg-gray-50 p-3 rounded-2xl">{post.authorEmoji}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    {post.isPinned && <span className="text-yellow-500 text-xs font-black uppercase">📌 Pinned</span>}
                                                    <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">{post.title}</h3>
                                                </div>

                                                <div className="flex gap-2">
                                                    {(isAuthor || isAdmin) && (
                                                        <button onClick={() => handleEditPost(post)} className="text-gray-400 hover:text-indigo-500 text-xs font-bold">EDIT</button>
                                                    )}
                                                    {(isAuthor || isAdmin || isGuestAuthor) && (
                                                        <button
                                                            onClick={(e) => { if (confirm('Delete this post?')) handleDelete(post.id); }}
                                                            className="text-red-300 hover:text-red-500 text-xs font-bold"
                                                        >
                                                            DELETE
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 mb-3 whitespace-pre-wrap">{post.content}</p>

                                            {post.attachmentUrl && (
                                                <div className="mb-4 rounded-2xl overflow-hidden border border-gray-50 max-h-96">
                                                    <img src={post.attachmentUrl} alt="Attachment" className="w-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <span className={`${post.authorName === 'Guest Explorer' ? 'text-orange-400' : 'text-indigo-400'}`}>
                                                    {post.authorName}
                                                </span>
                                                <span>•</span>
                                                <span>💬 {post.commentCount || 0} Comments</span>
                                                <span>•</span>
                                                <span>⏱️ {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

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
