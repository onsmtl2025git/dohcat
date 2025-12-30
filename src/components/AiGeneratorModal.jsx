import { useState } from 'react';
import { generateQuizContent } from '../services/aiService';

const AiGeneratorModal = ({ isOpen, onClose, onGenerate }) => {
    const [mode, setMode] = useState('topic'); // 'topic' or 'document'
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [grade, setGrade] = useState('3rd');
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const questions = await generateQuizContent({
                topic: mode === 'topic' ? topic : null,
                context: mode === 'document' ? context : null,
                grade,
                count
            });
            onGenerate(questions);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full animate-in fade-in zoom-in duration-200 text-left">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-display">
                            ✨ AI Magic Generator
                        </h2>
                        <p className="text-sm text-gray-500">Auto-Generates Questions + Visuals</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-2xl">✕</button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2 whitespace-pre-wrap">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleGenerate} className="space-y-6">

                    {/* Source Mode */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMode('topic')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'topic' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            By Topic
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('document')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'document' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            By Document/Text
                        </button>
                    </div>

                    {/* Dynamic Inputs */}
                    {mode === 'topic' ? (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="e.g. Solar System, Friendly Animals, Emotion Recognition"
                                required={mode === 'topic'}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Content / Context</label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px]"
                                placeholder="Paste your lesson plan, story, or article text here..."
                                required={mode === 'document'}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Grade Level</label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="1st">1st Grade</option>
                                <option value="2nd">2nd Grade</option>
                                <option value="3rd">3rd Grade</option>
                                <option value="4th">4th Grade</option>
                                <option value="5th">5th Grade</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Question Count</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">🌀</span> Generating Visuals & Questions...
                            </>
                        ) : (
                            <>✨ Generate with Visuals</>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        *System will try Gemini, OpenAI, DeepSeek, and Grok automatically.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AiGeneratorModal;
