import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";
import { NavLink } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ProfileCard from "./ProfileCard";
import Search from "./Search";
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
        setDiscoverUsers(data.data.forYou);
        setWebDevUsers(data.data.webDev);
        setMlUsers(data.data.ml);
        setOtherUsers(data.data.others);
      } catch (error) {
        console.log(error);
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        }
        localStorage.removeItem("userInfo");
        setUser(null);
        await axios.post("/auth/logout");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    getUser();
    getDiscoverUsers();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-[#2d2d2d] text-white">
        <div className="md:ml-[30vw] flex flex-col md:flex-row md:items-start items-center text-center md:text-left">
          <div className="bg-[#013e38] h-screen w-[20vw] p-[20px] fixed left-0 hidden md:flex flex-col justify-center items-center top-0">
            <Nav defaultActiveKey="/home" className="flex-column">
              <Nav.Link href="#for-you" className="text-white font-['Montserrat'] no-underline p-[10px] m-[5px] hover:text-[#6d706f] !text-[#f56664] !text-[20px] !-ml-[1rem]" id="foryou">
                For You
              </Nav.Link>
              <Nav.Link href="#popular" className="text-white font-['Montserrat'] no-underline p-[10px] m-[5px] hover:text-[#6d706f] !text-[#3bb4a1] !text-[20px] !-ml-[1rem]" id="popular1">
                Popular
              </Nav.Link>
              <Nav.Link href="#web-development" className="text-white font-['Montserrat'] no-underline p-[10px] m-[5px] hover:text-[#6d706f]">
                Web Development
              </Nav.Link>
              <Nav.Link href="#machine-learning" className="text-white font-['Montserrat'] no-underline p-[10px] m-[5px] hover:text-[#6d706f]">
                Machine Learning
              </Nav.Link>
              <Nav.Link href="#others" className="text-white font-['Montserrat'] no-underline p-[10px] m-[5px] hover:text-[#6d706f]">
                Others
              </Nav.Link>
            </Nav>
          </div>
          <div className="flex-[80%] max-w-[100vw] flex flex-col items-center md:items-start md:block">
            {loading ? (
              <div className="container d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <>
                {/* <div>
                  <Search />
                </div> */}
                <h1
                  id="for-you"
                  className="font-['Josefin_Sans'] text-[#fbf1a4] mt-[2rem] mb-[1rem]"
                >
                  For You
                </h1>
                <div className="flex flex-wrap md:p-[20px] p-0 justify-center md:justify-start items-center">
                  {discoverUsers && discoverUsers.length > 0 ? (
                    discoverUsers.map((user) => (
                      <ProfileCard
                        profileImageUrl={user?.picture}
                        name={user?.name}
                        rating={user?.rating ? user?.rating : 5}
                        bio={user?.bio}
                        skills={user?.skillsProficientAt}
                        username={user?.username}
                      />
                    ))
                  ) : (
                    <h1 style={{ color: "#fbf1a4" }}>No users to show</h1>
                  )}
                  {/* <ProfileCard
                    profileImageUrl="/assets/images/sample_profile.jpg"
                    name="Paakhi Maheshwari"
                    rating="⭐⭐⭐⭐⭐"
                    bio="Computer Science student specialising in data science and machine learning"
                    skills={["Machine Learning", "Python", "Data Science", "English", "Communication"]}
                  />
                  <ProfileCard
                    profileImageUrl="/assets/images/sample_profile2.jpeg"
                    name="Harsh Sharma"
                    rating="⭐⭐⭐⭐⭐"
                    bio="Web Developer and Competitive programmer, specialising in MERN stack."
                    skills={["React.JS", "MongoDB", "DSA", "Node.JS"]}
                  /> */}
                </div>
                <h1
                  id="popular"
                  className="font-['Josefin_Sans'] text-[#fbf1a4] mt-[1rem] mb-[3rem]"
                >
                  Popular
                </h1>
                <h2 id="web-development" className="font-['Montserrat'] mt-[5rem]">Web Development</h2>
                <div className="flex flex-wrap md:p-[20px] p-0 justify-center md:justify-start items-center">
                  {/* Profile cards go here */}
                  {webDevUsers && webDevUsers.length > 0 ? (
                    webDevUsers.map((user) => (
                      <ProfileCard
                        profileImageUrl={user?.picture}
                        name={user?.name}
                        rating={4}
                        bio={user?.bio}
                        skills={user?.skillsProficientAt}
                        username={user?.username}
                      />
                    ))
                  ) : (
                    <h1 style={{ color: "#fbf1a4" }}>No users to show</h1>
                  )}
                  {/* Add more ProfileCard components as needed */}
                </div>
                <h2 id="machine-learning" className="font-['Montserrat'] mt-[5rem]">Machine Learning</h2>
                <div className="flex flex-wrap md:p-[20px] p-0 justify-center md:justify-start items-center">
                  {mlUsers && mlUsers.length > 0 ? (
                    mlUsers.map((user) => (
                      <ProfileCard
                        profileImageUrl={user?.picture}
                        name={user?.name}
                        rating={4}
                        bio={user?.bio}
                        skills={user?.skillsProficientAt}
                        username={user?.username}
                      />
                    ))
                  ) : (
                    <h1 style={{ color: "#fbf1a4" }}>No users to show</h1>
                  )}
                  {/* <ProfileCard
                    profileImageUrl="/assets/images/profile2.png"
                    name="Madan Gupta"
                    rating="⭐⭐⭐⭐⭐"
                    bio="Experienced professor specialising in data science and machine learning"
                    skills={["Machine Learning", "Python", "Data Science", "English", "Communication"]}
                  />
                  <ProfileCard
                    profileImageUrl="/assets/images/profile4.jpg"
                    name="Karuna Yadav"
                    rating="⭐⭐⭐⭐"
                    bio="Working professional specialising in Artificial Intelligence and Machine Learning Research."
                    skills={["Machine Learning", "Python", "Data Science", "Artificial Intelligence"]}
                  /> */}
                </div>
                {/* <h2 id="graphic-design">Graphic Design</h2>
                <div className="profile-cards">
                  <ProfileCard
                    profileImageUrl="profile-image-url"
                    name="Name"
                    rating="⭐⭐⭐⭐⭐"
                    bio="yahan apan bio rakhre"
                    skills={["HTML", "CSS", "JS"]}
                  />
                  <ProfileCard
                    profileImageUrl="profile-image-url"
                    name="Name"
                    rating="⭐⭐⭐⭐⭐"
                    bio="yahan apan bio rakhre"
                    skills={["HTML", "CSS", "JS"]}
                  />
                </div>
                <h2 id="soft-skills">Soft Skills</h2>
                <div className="profile-cards">
                  <ProfileCard
                    profileImageUrl="profile-image-url"
                    name="Name"
                    rating="⭐⭐⭐⭐⭐"
                    bio="yahan apan bio rakhre"
                    skills={["HTML", "CSS", "JS"]}
                  />
                  <ProfileCard
                    profileImageUrl="profile-image-url"
                    name="Name"
                    rating="⭐⭐⭐⭐⭐"
                    bio="yahan apan bio rakhre"
                    skills={["HTML", "CSS", "JS"]}
                  />
                </div> */}
                <h2 id="others" className="font-['Montserrat'] mt-[5rem]">Others</h2>
                <div className="flex flex-wrap md:p-[20px] p-0 justify-center md:justify-start items-center">
                  {/* Profile cards go here */}
                  {otherUsers && otherUsers.length > 0 ? (
                    otherUsers.map((user) => (
                      <ProfileCard
                        profileImageUrl={user?.picture}
                        name={user?.name}
                        rating={4}
                        bio={user?.bio}
                        skills={user?.skillsProficientAt}
                        username={user?.username}
                      />
                    ))
                  ) : (
                    <h1 style={{ color: "#fbf1a4" }}>No users to show</h1>
                  )}
                  {/* <ProfileCard
                    profileImageUrl="/assets/images/profile.jpg"
                    name="Anil Khosla"
                    rating="⭐⭐⭐⭐"
                    bio="Professor - Maths 2 @ IIIT Raipur. Specialising in Algebra"
                    skills={["Mathematics", "Algebra", "Arithmetic"]}
                  />
                  <ProfileCard
                    profileImageUrl="/assets/images/profile3.jpg"
                    name="Rahul Goel"
                    rating="⭐⭐⭐⭐"
                    bio="Photography and art enthusiast. National Wildlife Photography Awardee."
                    skills={["Art", "Photography"]}
                  /> */}
                  {/* Add more ProfileCard components as needed */}
                </div>
                {/* Add more ProfileCard components as needed */}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Discover;
