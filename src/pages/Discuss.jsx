import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getPosts, createPost, deletePost } from '../services/discussService';

const Discuss = () => {
    const { user } = useUser();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // New Post Form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        try {
            await createPost(title, content, user || { uid: 'anon', email: 'anon@edu', emojis: ['👻'] });
            setShowCreate(false);
            setTitle('');
            setContent('');
            fetchPosts(); // Refresh
        } catch (error) {
            console.error("Failed to post", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-display mb-2">
                        Community Chat 🗨️
                    </h1>
                    <p className="text-gray-500 font-medium">Join the conversation with other Dohkittens!</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-lg hover:bg-rose-600 hover:scale-105 transition transform"
                >
                    + New Topic
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Loading discussions...</div>
            ) : (
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No topics yet. Be the first!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-rose-100 transition group cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl bg-gray-50 p-3 rounded-2xl">{post.authorEmoji}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-rose-500 transition">{post.title}</h3>
                                            {/* Admin Delete (Simple Check) */}
                                            {(user?.email?.includes('admin') || user?.uid === 'admin_uid') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this post?')) handleDelete(post.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded"
                                                >
                                                    DELETE
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            <span>{post.authorName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                💬 {post.commentCount} Comments
                                            </span>
                                            <span>•</span>
                                            <span>{post.views} Views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Simple Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Start a Discussion</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold focus:ring-2 focus:ring-rose-200 outline-none"
                                placeholder="Topic Title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                autoFocus
                            />
                            <textarea
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl font-medium focus:ring-2 focus:ring-rose-200 outline-none h-32 resize-none"
                                placeholder="What's on your mind?"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition shadow-lg"
                                >
                                    Post
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
