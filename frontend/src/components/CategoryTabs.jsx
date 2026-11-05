import React from 'react';

const CategoryTabs = ({ selectedCategory = 'HOTELS', onSelectCategory, className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-10 sm:gap-16 border-b border-slate-200/90 mb-4 px-2 ${className}`}>
      
      {/* Tab 1: HOTELS */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('HOTELS')}
        className="flex flex-col items-center justify-center cursor-pointer group pb-2.5 relative transition-all focus:outline-none"
        aria-label="Filter by Hotels"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <svg viewBox="0 0 48 48" className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base Shadow */}
            <ellipse cx="24" cy="43" rx="18" ry="3.5" fill="#000000" fillOpacity="0.08" />
            
            {/* Left Tower Building */}
            <path d="M12 20L22 14L28 17L18 23Z" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M12 20L18 23L18 45L12 43Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 23L28 17L28 41L18 45Z" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            
            {/* Left Tower Windows */}
            <rect x="13.5" y="24" width="2.2" height="3" rx="0.3" fill="#1E293B" />
            <rect x="13.5" y="29.5" width="2.2" height="3" rx="0.3" fill="#1E293B" />
            <rect x="13.5" y="35" width="2.2" height="3" rx="0.3" fill="#1E293B" />
            
            <rect x="20" y="22" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            <rect x="24" y="20" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            <rect x="20" y="28" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            <rect x="24" y="26" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            <rect x="20" y="34" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            <rect x="24" y="32" width="2.5" height="3" rx="0.3" fill="#3B82F6" opacity="0.8" />
            
            {/* Right Shorter Building */}
            <path d="M28 26L36 21L42 24L34 29Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M28 26L34 29L34 43L28 41Z" fill="#F1F5F9" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M34 29L42 24L42 40L34 43Z" fill="#CBD5E1" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>

        <span className={`text-xs sm:text-sm font-extrabold tracking-tight transition-colors mt-0.5 ${
          selectedCategory === 'HOTELS'
            ? 'text-[#0084ff]'
            : 'text-slate-700 group-hover:text-slate-900'
        }`}>
          Hotels
        </span>

        {/* Active Blue Indicator Underline */}
        {selectedCategory === 'HOTELS' ? (
          <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#0084ff] rounded-full shadow-xs animate-in fade-in duration-200"></div>
        ) : (
          <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-transparent"></div>
        )}
      </button>

      {/* Tab 2: VILLAS & HOMESTAYS */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('VILLAS')}
        className="flex flex-col items-center justify-center cursor-pointer group pb-2.5 relative transition-all focus:outline-none"
        aria-label="Filter by Villas and Homestays"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <svg viewBox="0 0 48 48" className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base Shadow */}
            <ellipse cx="26" cy="43" rx="19" ry="3.5" fill="#000000" fillOpacity="0.08" />
            
            {/* Tree beside house */}
            <ellipse cx="14" cy="27" rx="5" ry="6.5" fill="#38BDF8" opacity="0.4" />
            <ellipse cx="15.5" cy="25" rx="4" ry="5.5" fill="#0284C7" opacity="0.6" />
            <path d="M14.5 32V40" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
            
            {/* Villa Isometric Roof with Vibrant Cyan-Blue */}
            <path d="M22 17L38 10L44 19L28 26Z" fill="#0284C7" stroke="#0369A1" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M18 21L28 15L28 26L18 31Z" fill="#0084FF" stroke="#0284C7" strokeWidth="1.2" strokeLinejoin="round" />
            
            {/* Front Wall */}
            <path d="M18 31L28 26L28 42L18 45Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            
            {/* Side Wall */}
            <path d="M28 26L42 19L42 35L28 42Z" fill="#F1F5F9" stroke="#1E293B" strokeWidth="1.2" strokeLinejoin="round" />
            
            {/* Door (Archway) */}
            <path d="M21 38C21 35.8 22.8 34 25 34V43.5L21 44.5V38Z" fill="#1E293B" />
            
            {/* Side Windows */}
            <rect x="31" y="27" width="4" height="4.5" rx="0.5" fill="#0084FF" />
            <rect x="36.5" y="24" width="4" height="4.5" rx="0.5" fill="#0084FF" />
          </svg>
        </div>

        <span className={`text-xs sm:text-sm font-extrabold tracking-tight transition-colors mt-0.5 ${
          selectedCategory === 'VILLAS'
            ? 'text-[#0084ff]'
            : 'text-slate-700 group-hover:text-slate-900'
        }`}>
          Villas & Homestays
        </span>

        {/* Active Blue Indicator Underline */}
        {selectedCategory === 'VILLAS' ? (
          <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#0084ff] rounded-full shadow-xs animate-in fade-in duration-200"></div>
        ) : (
          <div className="absolute -bottom-px left-0 right-0 h-[3px] bg-transparent"></div>
        )}
      </button>

    </div>
  );
};

export default CategoryTabs;
