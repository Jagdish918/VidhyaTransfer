import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import { Spinner } from "react-bootstrap";

const Rating = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (review.trim() === "") {
      toast.error("Please enter a review");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(`/rating/rateUser`, {
        rating: rating,
        description: review,
        username: user.username,
      });
      toast.success(data.message);
      setRating(0);
      setReview("");
    } catch (error) {
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
    <div className="flex flex-col justify-center items-center font-['Montserrat'] bg-[#2d2d2d] min-h-[90vh] py-5 min-w-full">
      <div className="flex md:flex-row flex-col justify-around items-center bg-[#013e3846] p-16 rounded-2xl min-w-[60vw] border-2 border-[#fbf1a4]">
        <h2 className="text-[#3bb4a1]">Give a Rating</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col justify-center">
            <div className="text-[30px] flex md:block justify-center">
              <p style={{ color: "white", fontSize: "1rem" }}>Rate stars out of 5:</p>
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`cursor-pointer ${value <= rating ? "text-[#fbf1a4]" : "text-[#6d6e70]"}`}
                  onClick={() => handleStarClick(value)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              placeholder="Write a review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full mt-2.5 p-2.5 border border-[#6d6e70] rounded-[5px]"
            ></textarea>
            <button type="submit" className="mt-2.5 px-5 py-2.5 bg-[#3bb4a1] text-white border-none rounded-[5px] cursor-pointer hover:bg-[#013e38]">
              {loading ? <Spinner animation="border" variant="primary" /> : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rating;
