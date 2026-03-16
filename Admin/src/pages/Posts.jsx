import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AiOutlineDelete, AiOutlineHeart, AiOutlineSearch } from 'react-icons/ai';

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await axios.get('/admin/posts');
                if (data.success) {
                    setPosts(data.data.posts || data.data); // support both formats
                }
            } catch (error) {
                toast.error("Failed to fetch posts");
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const { data } = await axios.delete(`/admin/posts/${id}`);
            if (data.success) {
                toast.success("Post deleted");
                setPosts(posts.filter(p => p._id !== id));
            }
        } catch (error) {
            toast.error("Failed to delete post");
        }
    };

    const filteredPosts = posts.filter(post =>
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading Posts...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Post Management</h1>
                <div className="relative">
                    <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-gray-500">No posts found.</div>
                ) : filteredPosts.map((post) => (
                    <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                            <img src={post.author?.picture || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <div className="font-medium text-gray-900 text-sm">{post.author?.name || "Unknown"}</div>
                                <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-700 text-sm line-clamp-3 mb-4">{post.content}</p>
                            {post.attachments && post.attachments.length > 0 && (
                                <img src={post.attachments[0]} alt="Attachment" className="w-full h-32 object-cover rounded-lg mb-4" />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <AiOutlineHeart className="text-red-500" />
                                <span>{post.likes ? post.likes.length : 0}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(post._id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="Delete Post"
                            >
                                <AiOutlineDelete size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Posts;
