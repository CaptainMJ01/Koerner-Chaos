import React from 'react';

export const Button = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyles = "px-6 py-3 text-sm md:text-base uppercase font-bold border-4 active:translate-y-1 transition-transform";
  
  const variants = {
    primary: "bg-orange-500 border-orange-700 text-white hover:bg-orange-400 shadow-[4px_4px_0px_0px_rgba(194,65,12,1)]",
    secondary: "bg-gray-700 border-gray-900 text-gray-200 hover:bg-gray-600 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)]",
    danger: "bg-red-600 border-red-800 text-white hover:bg-red-500 shadow-[4px_4px_0px_0px_rgba(153,27,27,1)]",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};