const BentoCard = ({ title, description, icon, color = "bg-white", onClick, className = "" }) => {
    return (
        <div
            onClick={onClick}
            className={`
          ${color} relative overflow-hidden rounded-3xl p-6 
          cursor-pointer transition-all duration-300
          hover:scale-[1.02] hover:shadow-xl shadow-sm
          group border border-white/50
          ${className}
        `}
        >
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 duration-300">
                        {icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 font-display">
                        {title}
                    </h3>
                    <p className="text-gray-600 font-medium leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/50 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </div>

            {/* Decorative background blob */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all" />
        </div>
    );
};

export default BentoCard;
