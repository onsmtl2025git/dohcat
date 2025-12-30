import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { createQuiz, subscribeToQuizzes } from '../services/quizService';
import AiGeneratorModal from '../components/AiGeneratorModal';

const CreateQuiz = () => {
    const { user } = useUser();
    const nav = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([
        { id: 1, text: '', options: ['', '', '', ''], correctIndex: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [recentQuizzes, setRecentQuizzes] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToQuizzes((all) => {
            setRecentQuizzes(all.slice(0, 5)); // Show top 5
        });
        return () => unsubscribe();
    }, []);

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ));
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

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now(), text: '', options: ['', '', '', ''], correctIndex: 0 }
        ]);
    };

    const removeQuestion = (id) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleAiGenerated = (newQuestions) => {
        setQuestions(newQuestions);
        alert("✨ Magic! Questions generated successfully. Review them below!");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("You must be logged in!");

        setLoading(true);
        try {
            await createQuiz({
                title,
                description,
                questions
            }, user.uid);
            alert("Quiz Created Successfully!");
            nav('/');
        } catch (error) {
            console.error(error);
            alert("Failed to create quiz.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Col: Creation Form */}
            <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-[var(--color-leo-primary)] mb-8 font-display">
                    Create a New Quiz
                </h1>

                <div className="flex justify-start mb-8">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 animate-pulse-slow"
                    >
                        ✨ Magic Generate with AI
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Quiz Info */}
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-700">Quiz Details</h2>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g., Fun with Mathematics"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="What is this quiz about?"
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <div key={q.id} className="glass-card p-6 relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-indigo-600">Question {index + 1}</h3>
                                        {q.imageUrl && (
                                            <div className="mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md inline-flex items-center gap-1">
                                                <span>🖼️</span> Has Visual
                                            </div>
                                        )}
                                    </div>

                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(q.id)}
                                            className="text-red-400 hover:text-red-600 font-bold text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    {q.imageUrl && (
                                        <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                            <img
                                                src={q.imageUrl}
                                                alt="Visual Hint"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                            className="w-full h-full px-4 py-3 bg-white rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                            placeholder="Enter question text..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${q.correctIndex === optIndex ? 'bg-green-50 ring-1 ring-green-200' : 'bg-transparent'}`}>
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={q.correctIndex === optIndex}
                                                onChange={() => handleQuestionChange(q.id, 'correctIndex', optIndex)}
                                                className="w-5 h-5 text-green-500 focus:ring-green-500"
                                                title="Mark as correct answer"
                                            />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(q.id, optIndex, e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white/50 rounded-lg border border-transparent focus:border-indigo-200 outline-none text-sm"
                                                placeholder={`Option ${optIndex + 1}`}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-6">
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="px-6 py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition"
                            >
                                + Add 1
                            </button>
                            <span className="text-gray-400 font-bold">OR</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const count = prompt("How many empty questions?", "5");
                                    if (count && !isNaN(count)) {
                                        const newQs = Array.from({ length: parseInt(count) }, (_, i) => ({
                                            id: Date.now() + i,
                                            text: '',
                                            options: ['', '', '', ''],
                                            correctIndex: 0
                                        }));
                                        setQuestions([...questions, ...newQs]);
                                    }
                                }}
                                className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm"
                            >
                                + Add Bulk...
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-[var(--color-leo-accent)] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                        >
                            {loading ? 'Saving...' : 'Save Quiz'}
                        </button>
                    </div>
                </form>

                <AiGeneratorModal
                    isOpen={showAiModal}
                    onClose={() => setShowAiModal(false)}
                    onGenerate={handleAiGenerated}
                />
            </div>

            {/* Right Col: Fresh Catpools */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 glass-panel p-6 rounded-[2rem] bg-purple-500/90 border-transparent text-white">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">Fresh Catpools 🐾</h2>
                        <span className="text-xl">✨</span>
                    </div>
                    <div className="space-y-4">
                        {recentQuizzes.map((quiz, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-2 inline-block">NEW</span>
                                <h3 className="font-bold text-sm mb-1">{quiz.title}</h3>
                                <p className="text-xs opacity-70 mb-2 truncate">{quiz.description}</p>
                                <div className="text-[10px] font-mono bg-black/20 px-2 py-1 rounded inline-block">
                                    Create Time: {quiz.createdAt?.seconds ? new Date(quiz.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                </div>
                            </div>
                        ))}
                        {recentQuizzes.length === 0 && (
                            <div className="text-center opacity-70 text-sm italic">
                                Be the first to create a quiz!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateQuiz;
