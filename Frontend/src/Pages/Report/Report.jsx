import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { toast } from "react-toastify";

const ReportForm = () => {
  const { username } = useParams();

  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username,
    reportedUsername: username,
    issue: "",
    issueDescription: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.issue === "" || formData.issueDescription === "") {
      toast.error("Please fill all the details");
      return;
    }
    // console.log("formData:", formData);
    try {
      setLoading(true);
      const { data } = await axios.post(`/report/create`, formData);
      toast.success(data.message);
      setFormData((prevState) => {
        return {
          ...formData,
          issue: "",
          issueDescription: "",
        };
      });
    } catch (error) {
      console.log(error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
        if (error.response.data.message === "Please Login") {
          localStorage.removeItem("userInfo");
          setUser(null);
          await axios.get("/auth/logout");
          navigate("/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#2d2d2d] min-h-screen min-w-[70vw]">
      <h1 className="p-12 text-center text-[#f56664] font-['Montserrat']">REPORT PROFILE</h1>
      <div className="bg-[#f1f1f1] p-4 min-w-[70vw] m-20 mt-4 rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="text-[#087464] mb-2.5 mt-4" htmlFor="username">
              Your Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="bg-[#f1f1f1] border border-[#3bb4a1] rounded-[5px] p-[10px] w-[70%] mb-5 placeholder-[#6d6e7089]"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[#087464] mb-2.5 mt-4" htmlFor="reportedUsername">
              Username to be reported
            </label>
            <input
              type="text"
              id="reportedUsername"
              name="reportedUsername"
              className="bg-[#f1f1f1] border border-[#3bb4a1] rounded-[5px] p-[10px] w-[70%] mb-5 placeholder-[#6d6e7089]"
              placeholder="Enter username to be reported"
              value={formData.reportedUsername}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[#087464] mb-2.5 mt-4">What was the nature of the issue?</label>
            <div className="flex mb-5 items-center">
              <input
                type="radio"
                id="conduct"
                name="issue"
                value="Personal conduct"
                checked={formData.issue === "Personal conduct"}
                onChange={handleChange}
                className="m-[0.3rem] ml-4"
              />
              <label htmlFor="conduct" className="text-[#2d2d2d]">Personal conduct</label>
              <input
                type="radio"
                id="expertise"
                name="issue"
                value="Professional expertise"
                checked={formData.issue === "Professional expertise"}
                onChange={handleChange}
                className="m-[0.3rem] ml-4"
              />
              <label htmlFor="expertise" className="text-[#2d2d2d]">Professional expertise</label>
              <input
                type="radio"
                id="others"
                name="issue"
                value="Others"
                checked={formData.issue === "Others"}
                onChange={handleChange}
                className="m-[0.3rem] ml-4"
              />
              <label htmlFor="others" className="text-[#2d2d2d]">Others</label>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[#087464] mb-2.5 mt-4" htmlFor="issueDescription">
              Describe the issue to us
            </label>
            <textarea
              id="issueDescription"
              name="issueDescription"
              className="bg-[#f1f1f1] border border-[#3bb4a1] rounded-[5px] p-[10px] w-[70%] mb-5 placeholder-[#6d6e7089] h-[150px]"
              placeholder="Enter description"
              value={formData.issueDescription}
              onChange={handleChange}
            ></textarea>
          </div>
          <div className="w-full flex justify-center md:block md:w-auto">
            <button type="submit" className="bg-[#3bb4a1] text-white border-none px-5 py-2.5 rounded-[5px] cursor-pointer hover:bg-[#013e38]">
              {loading ? (
                <>
                  <Spinner animation="border" variant="light" size="sm" style={{ marginRight: "0.5rem" }} />
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
