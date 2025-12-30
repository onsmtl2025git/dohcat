import { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Placeholder for form submission logic
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 shadow-sm rounded-xl border border-gray-100">
                <div className="mb-6">
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="Your Name"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="your@email.com"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder="How can we help?"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                >
                    Send Message
                </button>
            </form>
        </div>
    );
};

export default Contact;
