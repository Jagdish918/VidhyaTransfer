import { toast } from "react-toastify";
import axios from "axios";

const ApiCall = async (url, method, navigate, setUser, data) => {
  console.log("******** Inside ApiCall function ********");

  if (method === "GET") {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setUser(null); // Clear context only for auth-level errors
        toast.error("You are not authorized to access this page. Please login first.");
        navigate("/login");
      } else if (status === 404) {
        toast.error("The requested resource was not found.");
      } else if (status === 500) {
        toast.error("Server Error. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    }
  } else if (method === "POST") {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setUser(null); // Clear context only for auth-level errors
        toast.error("You are not authorized to access this page. Please login first.");
        navigate("/login");
      } else if (status === 404) {
        toast.error("The requested resource was not found.");
      } else if (status === 500) {
        toast.error("Server Error. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    }
  }
};

export default ApiCall;
