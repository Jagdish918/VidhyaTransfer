import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        <div className="text-sm text-gray-400 font-sans text-center md:text-left">
          © 2025 SkillSwap. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-400 no-underline transition-colors duration-200 hover:text-gray-500 font-sans">Privacy Policy</a>
          <a href="#" className="text-sm text-gray-400 no-underline transition-colors duration-200 hover:text-gray-500 font-sans">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
