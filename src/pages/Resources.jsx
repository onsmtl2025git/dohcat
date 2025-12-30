import { useState, useEffect } from 'react';
import { getResources } from '../services/resourceService';

const Resources = () => {
    const [resources, setResources] = useState([]);

    useEffect(() => {
        const fetchResources = async () => {
            const data = await getResources();
            setResources(data);
        };
        fetchResources();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Learning Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
                {resources.map((resource) => (
                    <div key={resource.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full mb-3">
                            {resource.category}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.title}</h3>
                        <p className="text-gray-600 mb-4">{resource.description}</p>
                        <button className="text-indigo-600 font-medium hover:text-indigo-800 transition flex items-center">
                            Access Resource &rarr;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Resources;
