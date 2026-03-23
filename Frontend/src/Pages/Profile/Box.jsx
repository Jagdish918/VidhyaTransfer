import React from "react";

const Box = ({ head, date, spec, desc, skills, score }) => {
  return (
    <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border shadow-sm hover:shadow-card transition-all hover:bg-dark-card hover:border-cyan-500/30 mb-4">
      <div className="flex justify-between items-start mb-3 gap-4">
        <h5 className="text-base font-bold text-slate-900 tracking-tight">{head}</h5>
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 shrink-0 bg-dark-card border border-dark-border px-3 py-1.5 rounded-full shadow-sm">{date}</span>
      </div>

      {spec && <div className="text-cyan-700 font-bold text-xs uppercase tracking-widest mb-3">{spec}</div>}

      {desc && <p className="text-slate-700 text-sm leading-relaxed mb-5 font-medium">{desc}</p>}

      {skills && skills.length > 0 && (
        <div className="mt-4 bg-dark-card p-4 rounded-xl border border-dark-border">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Skills Used:</p>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {score && (
        <div className="mt-5 pt-4 border-t border-dark-border flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Grade / Percentage</span>
          <span className="text-sm font-bold text-slate-900 bg-dark-card px-4 py-1.5 rounded-full shadow-sm border border-dark-border">{score}</span>
        </div>
      )}
    </div>
  );
};

export default Box;
