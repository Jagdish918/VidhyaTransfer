import React from "react";

const PostSkeleton = () => {
    return (
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-100 p-6 mb-8 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
                    <div className="flex flex-col gap-2">
                        <div className="h-4 bg-slate-100 rounded-full w-32"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-slate-50 rounded-full w-16"></div>
                            <div className="h-1 w-1 bg-slate-100 rounded-full"></div>
                            <div className="h-3 bg-slate-50 rounded-full w-12"></div>
                        </div>
                    </div>
                </div>
                <div className="h-8 bg-slate-50 rounded-xl w-20"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
                <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                <div className="h-4 bg-slate-100 rounded-full w-11/12"></div>
                <div className="h-4 bg-slate-100 rounded-full w-4/5"></div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-5 border-t border-slate-50">
                <div className="flex gap-4">
                    <div className="h-10 bg-slate-100 rounded-xl w-16"></div>
                    <div className="h-10 bg-slate-100 rounded-xl w-16"></div>
                    <div className="h-10 bg-slate-100 rounded-xl w-12"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-xl w-10"></div>
            </div>
        </div>
    );
};

export default PostSkeleton;
