import React from "react";

const Box = ({ head, date, spec, desc, skills, score }) => {
  return (
    <div className="bg-[#fafafa] p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all hover:bg-white hover:border-gray-200 mb-5">
      <div className="flex justify-between items-start mb-3">
        <h5 className="text-lg font-black text-gray-900 tracking-tight">{head}</h5>
        <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 whitespace-nowrap pt-1 bg-white px-3 py-1.5 rounded-full shadow-sm">{date}</span>
      </div>

      {spec && <div className="text-[#3bb4a1] font-black text-[10px] uppercase tracking-widest mb-3">{spec}</div>}

      {desc && <p className="text-gray-600 text-sm leading-relaxed mb-5 font-medium">{desc}</p>}

      {skills && skills.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-[1.2rem] border border-gray-50">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Skills Used:</p>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-4 py-2 rounded-[1rem] text-[9px] uppercase tracking-widest font-black bg-blue-50 text-blue-700 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {score && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Grade / Percentage</span>
          <span className="text-sm font-black text-gray-900 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">{score}</span>
        </div>
      )}
    </div>
  );
};

export default Box;
