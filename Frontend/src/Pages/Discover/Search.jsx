import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const Search = () => {
  const [isActive, setIsActive] = useState(false);

  const handleFocus = () => {
    setIsActive(true);
  };

  const handleBlur = () => {
    setIsActive(false);
  };

  return (
    <div className={`-translate-y-1/2 bg-[#f0f0f0] rounded-[20px] px-[20px] py-[10px] mt-[3rem] mb-[3rem] flex items-center transition-[width] duration-300 group ${isActive ? 'w-[90%]' : 'w-[80%]'}`}>
      <input
        type="text"
        placeholder="Search..."
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="flex-1 border-none bg-transparent outline-none text-[16px]"
      />
      <FiSearch className="text-[#999] transition-colors duration-300 group-hover:text-[#333]" />
    </div>
  );
};

export default Search;
