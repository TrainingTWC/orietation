
import React from 'react';

export const Spinner: React.FC = () => {
    return (
        <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 animate-spin animation-delay-150"></div>
        </div>
    );
};
