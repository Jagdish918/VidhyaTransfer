import React from "react";
import { Link, useLocation } from "react-router-dom";

const steps = [
  { label: "Basic info", path: "/onboarding/personal-info" },
  { label: "Skills", path: "/onboarding/skills" },
  { label: "Availability", path: "/onboarding/preferences" },
];

const getActiveIndex = (pathname) => {
  const idx = steps.findIndex((s) => pathname.startsWith(s.path));
  return idx === -1 ? 0 : idx;
};

export default function OnboardingStepper() {
  const { pathname } = useLocation();
  const activeIdx = getActiveIndex(pathname);

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
        {steps.map((s, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          return (
            <Link
              key={s.path}
              to={s.path}
              className={`flex-1 min-w-0 rounded-lg px-2 py-2 text-center border transition-colors no-underline ${
                isActive
                  ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                  : isDone
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="block truncate">{s.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-[width] duration-300"
          style={{ width: `${((activeIdx + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

