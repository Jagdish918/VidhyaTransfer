import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { Chat } from "../../models/chat.model.js";
import { Rating } from "../../models/rating.model.js";

export const rateUser = asyncHandler(async (req, res) => {
  console.log("\n******** Inside rateUser Controller function ********");

  const { rating, description, username } = req.body;

  if (!rating || !description || !username) {
    throw new ApiError(400, "Please provide all the details");
  }

  // ✅ FIX: Prevent self-rating
  if (req.user.username === username) {
    throw new ApiError(400, "You cannot rate yourself");
  }

  // ✅ FIX: Validate rating is between 1 and 5
  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new ApiError(400, "Rating must be a number between 1 and 5");
  }

  // ✅ FIX: Cap description length
  if (description.length > 500) {
    throw new ApiError(400, "Review description must be under 500 characters");
  }

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const rateGiver = req.user._id;

  console.log("rateGiver: ", rateGiver);
  console.log("user: ", user._id);

  // find if there is chat between the two users
  const chat = await Chat.findOne({
    users: { $all: [rateGiver, user._id] },
  });

  if (!chat) {
    throw new ApiError(400, "Please connect first to rate the user");
  }

  const rateExist = await Rating.findOne({
    rater: rateGiver,
    username: username,
  });

  console.log("rateExist: ", rateExist);

  if (rateExist) {
    throw new ApiError(400, "You have already rated this user");
  }

  var rate = await Rating.create({
    rating: numRating,  // use validated number
    description: description,
    username: username,
    rater: rateGiver,
  });

  if (!rate) {
    throw new ApiError(500, "Rating not added");
  }

  const ratings = await Rating.find({ username: username });

  //   find average of the ratings
  let total = 0;
  ratings.forEach((r) => {
    total += r.rating;
  });
  const avgRating = total / ratings.length;

  await User.findByIdAndUpdate(
    { _id: user._id },
    {
      rating: avgRating,
    }
  );

  res.status(200).json(new ApiResponse(200, rate, "Rating added successfully"));
});

export const getRatings = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const ratings = await Rating.find({ username }).populate("rater", "name picture username");
  res.status(200).json(new ApiResponse(200, ratings, "Ratings fetched successfully"));
});
