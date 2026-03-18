import React from "react";

const PostSkeleton = () => {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-8 mb-8 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                            <div className="h-1 w-1 bg-gray-200 rounded-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                    </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-5">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mb-5">
                <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-24"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-4">
                    <div className="h-8 bg-gray-200 rounded-lg w-14"></div>
                    <div className="h-8 bg-gray-200 rounded-lg w-14"></div>
                    <div className="h-8 bg-gray-200 rounded-lg w-10"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-8"></div>
            </div>
        </div>
    );
};

export default PostSkeleton;
