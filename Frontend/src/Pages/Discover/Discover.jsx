import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";
import ProfileCard from "./ProfileCard";
import Spinner from "react-bootstrap/Spinner";

const Discover = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [webDevUsers, setWebDevUsers] = useState([]);
  const [mlUsers, setMlUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/user/registered/getDetails`);
        setUser(data.data);
        storeSanitizedUserData(data.data);
      } catch (error) {
        console.log(error);
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        }
        localStorage.removeItem("userInfo");
        setUser(null);
        await axios.post("/auth/logout");
        navigate("/login");
      }
    };
    const getDiscoverUsers = async () => {
      try {
        const { data } = await axios.get("/user/discover");
        setDiscoverUsers(data.data.forYou || []);
        setWebDevUsers(data.data.webDev || []);
        setMlUsers(data.data.ml || []);
        setOtherUsers(data.data.others || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
    getDiscoverUsers();
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-900 pt-16">
      <div className="flex flex-col md:flex-row items-start">
        {/* Modern Sidebar */}
        <aside className="w-full md:w-[260px] md:h-[calc(100vh-64px)] p-6 md:sticky md:top-16 bg-dark-card border-r border-dark-border z-10">
          <div className="mb-8">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Discover Feed</h2>
            <nav className="flex flex-col gap-1">
              {[
                { id: 'for-you', label: 'For You', icon: '✨', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { id: 'web-development', label: 'Web Dev', icon: '💻', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { id: 'machine-learning', label: 'AI & ML', icon: '🤖', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { id: 'others', label: 'Others', icon: '🌐', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all no-underline text-slate-600 hover:text-cyan-600 hover:bg-dark-hover"
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-12 p-5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <h4 className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-2">Pro Tip</h4>
            <p className="text-[11px] text-cyan-600 font-medium leading-relaxed">
              Connect with users who have "Skills Proficient At" that match your "Skills To Learn"!
            </p>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="app-container">
            <header className="mb-10 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-cyan-500 to-emerald-500 bg-clip-text text-transparent tracking-tight mb-2">Discover New People</h1>
              <p className="text-sm font-medium text-slate-600">Find and connect with mentors or peers based on their unique skillsets.</p>
            </header>

            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="space-y-16">
                {/* For You Section */}
                <section>
                  <h2 id="for-you" className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="p-2 bg-amber-500/10 rounded-lg text-amber-500">✨</span> For You
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {discoverUsers.length > 0 ? (
                      discoverUsers.map((u) => (
                        <ProfileCard
                          key={u._id}
                          profileImageUrl={u.picture}
                          name={u.name}
                          rating={u.rating || 4.5}
                          bio={u.bio}
                          skills={u.skillsProficientAt}
                          username={u.username}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-white border border-dashed border-dark-border rounded-3xl w-full">
                        <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[9px]">No direct matches for you yet</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Web Dev Section */}
                <section>
                  <h2 id="web-development" className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">💻</span> Web Development
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {webDevUsers.length > 0 ? (
                      webDevUsers.map((u) => (
                        <ProfileCard
                          key={u._id}
                          profileImageUrl={u.picture}
                          name={u.name}
                          rating={u.rating || 4.0}
                          bio={u.bio}
                          skills={u.skillsProficientAt}
                          username={u.username}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-white border border-dashed border-dark-border rounded-3xl w-full">
                        <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[9px]">No web developers found</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* AI / ML Section */}
                <section>
                  <h2 id="machine-learning" className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">🤖</span> Machine Learning
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {mlUsers.length > 0 ? (
                      mlUsers.map((u) => (
                        <ProfileCard
                          key={u._id}
                          profileImageUrl={u.picture}
                          name={u.name}
                          rating={u.rating || 4.2}
                          bio={u.bio}
                          skills={u.skillsProficientAt}
                          username={u.username}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-white border border-dashed border-dark-border rounded-3xl w-full">
                        <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[9px]">No ML specialists found</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Others Section */}
                <section>
                  <h2 id="others" className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">🌐</span> Others
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {otherUsers.length > 0 ? (
                      otherUsers.map((u) => (
                        <ProfileCard
                          key={u._id}
                          profileImageUrl={u.picture}
                          name={u.name}
                          rating={u.rating || 3.8}
                          bio={u.bio}
                          skills={u.skillsProficientAt}
                          username={u.username}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center bg-white border border-dashed border-dark-border rounded-3xl w-full">
                        <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[9px]">No other users found</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Discover;
