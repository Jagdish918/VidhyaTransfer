import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { Request } from "../../models/request.model.js";
import { UnRegisteredUser } from "../../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../../utils/generateJWTToken.js";
import { uploadOnCloudinary } from "../../config/connectCloudinary.js";
import { sendMail } from "../../utils/SendMail.js";

// ✅ FIX: Escape regex special characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ FIX: In-memory cooldown map for sendScheduleMeet (prevents email spam)
// Format: "senderUsername->receiverUsername" => timestamp of last send
const scheduleMeetCooldown = new Map();
const SCHEDULE_MEET_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export const userDetailsWithoutID = asyncHandler(async (req, res) => {
  console.log("\n******** Inside userDetailsWithoutID Controller function ********");

  // Remove sensitive fields before sending
  const { password, resetPasswordToken, resetPasswordExpires, __v, ...safeUser } = req.user.toObject ? req.user.toObject() : req.user;

  return res.status(200).json(new ApiResponse(200, safeUser, "User details fetched successfully"));
});

export const UserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UserDetails Controller function ********");
  const param = req.params.username;

  let query = {};
  // Check if param is a valid MongoDB ObjectId
  if (param.match(/^[0-9a-fA-F]{24}$/)) {
    query = { _id: param };
  } else {
    query = { username: param };
  }

  const user = await User.findOne(query)
    .select('-password -resetPasswordToken -resetPasswordExpires -__v');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const receiverID = user._id;
  const senderID = req.user._id;
  const request = await Request.find({
    $or: [
      { sender: senderID, receiver: receiverID },
      { sender: receiverID, receiver: senderID },
    ],
  });

  // console.log("request", request);

  const status = request.length > 0 ? request[0].status : "Connect";

  // console.log(" userDetail: ", userDetail);
  // console.log("user", user);
  return res
    .status(200)
    .json(new ApiResponse(200, { ...user._doc, status: status }, "User details fetched successfully"));
});

export const UnRegisteredUserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UnRegisteredUserDetails Controller function ********");

  // console.log(" UnRegisteredUserDetail: ", userDetail);
  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const saveRegUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("\n******** Inside saveRegUnRegisteredUser Controller function ********");

  const { name, email, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn } =
    req.body;
  // console.log("Body: ", req.body);

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }

  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    throw new ApiError(400, "Username already exists");
  }

  const user = await UnRegisteredUser.findOneAndUpdate(
    { email: email },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
    }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }
  // console.log(" UnRegisteredUserDetail: ", userDetail);
  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduUnRegisteredUser Function *******");

  const { education, email } = req.body;
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    // console.log("Education: ", edu);
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddUnRegisteredUser Function *******");

  const { bio, projects, email } = req.body;
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  if (projects.size > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { bio: bio, projects: projects });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const registerUser = async (req, res) => {
  console.log("\n******** Inside registerUser function ********");
  // Sensitive user data removed from log to prevent PII exposure in production

  const {
    name,
    email,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    education,
    bio,
    projects,
  } = req.body;

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }
  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }
  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }
  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }
  if (projects.size > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new ApiError(400, "User Already registered");
  }

  const checkUsername = await User.findOne({ username: username });
  if (checkUsername) {
    throw new ApiError(400, "Username already exists");
  }

  const newUser = await User.create({
    name: name,
    email: email,
    username: username,
    linkedinLink: linkedinLink,
    githubLink: githubLink,
    portfolioLink: portfolioLink,
    skillsProficientAt: skillsProficientAt,
    skillsToLearn: skillsToLearn,
    education: education,
    bio: bio,
    projects: projects,
    picture: req.user.picture,
  });

  if (!newUser) {
    throw new ApiError(500, "Error in saving user details");
  }

  await UnRegisteredUser.findOneAndDelete({ email: email });

  const IS_PROD = process.env.NODE_ENV === "production";
  const jwtToken = generateJWTToken_username(newUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessToken", jwtToken, {
    httpOnly: true,
    expires: expiryDate,
    secure: IS_PROD,                            // ✅ FIX: HTTPS-only in production
    sameSite: IS_PROD ? "Strict" : "Lax",      // ✅ FIX: CSRF protection in production
    path: "/",
  });
  res.clearCookie("accessTokenRegistration");
  return res.status(200).json(new ApiResponse(200, newUser, "NewUser registered successfully"));
};

export const saveRegRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveRegRegisteredUser Function *******");

  const { name, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn, picture } =
    req.body;

  if (!name || !username || !skillsProficientAt || skillsProficientAt.length === 0) {
    throw new ApiError(400, "Please provide name, username, and at least one proficient skill");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if ((!githubLink || githubLink === "") && (!linkedinLink || linkedinLink === "") && (!portfolioLink || portfolioLink === "")) {
    throw new ApiError(400, "Please provide at least one social link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  // Check if username is being changed
  const isUsernameChanged = req.user.username !== username;

  if (isUsernameChanged) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ApiError(400, "Username already exists");
    }
  }

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
      picture: picture,
    },
    { new: true } // Return the updated document
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  // If username changed, we MUST issue a new token because the old one encoded the old username
  if (isUsernameChanged) {
    const IS_PROD = process.env.NODE_ENV === "production";
    const jwtToken = generateJWTToken_username(user);
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    res.cookie("accessToken", jwtToken, {
      httpOnly: true,
      expires: expiryDate,
      secure: IS_PROD,                          // ✅ FIX: HTTPS-only in production
      sameSite: IS_PROD ? "Strict" : "Lax",    // ✅ FIX: CSRF protection in production
      path: "/",
    });
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduRegisteredUser Function *******");

  const { education } = req.body;

  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }

  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Institution and degree are required for each education entry");
    }
    // Optional validation for score and dates if provided
    if (edu.score && (edu.score < 0 || edu.score > 100)) {
      throw new ApiError(400, "Score must be between 0 and 100");
    }
    if (edu.startDate && edu.endDate && edu.startDate > edu.endDate) {
      throw new ApiError(400, "Start date must be before end date");
    }
  });

  const user = await User.findOneAndUpdate({ username: req.user.username }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddRegisteredUser Function *******");

  const { bio, projects, tutorialVideo } = req.body;

  // Bio is optional but if provided, must be under 500 chars
  if (bio && bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  // Validate projects if provided
  if (projects && Array.isArray(projects) && projects.length > 0) {
    projects.forEach((project) => {
      if (!project.title) {
        throw new ApiError(400, "Project title is required");
      }
      // Optional validation for project link if provided
      if (project.projectLink && !project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      // Optional validation for dates if both provided
      if (project.startDate && project.endDate && project.startDate > project.endDate) {
        throw new ApiError(400, "Project start date must be before end date");
      }
    });
  }

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { bio, projects, tutorialVideo },
    { new: true }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

// export const updateRegisteredUser = asyncHandler(async (req, res) => {
//   console.log("******** Inside updateRegisteredUser Function *******");

//   const {
//     name,
//     username,
//     linkedinLink,
//     githubLink,
//     portfolioLink,
//     skillsProficientAt,
//     skillsToLearn,
//     education,
//     bio,
//     projects,
//   } = req.body;

//   if (!name || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
//     throw new ApiError(400, "Please provide all the details");
//   }

//   if (username.length < 3) {
//     throw new ApiError(400, "Username should be atleast 3 characters long");
//   }

//   if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
//     throw new ApiError(400, "Please provide atleast one link");
//   }

//   const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
//   const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
//   if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
//     throw new ApiError(400, "Please provide valid github and linkedin links");
//   }

//   if (education.length === 0) {
//     throw new ApiError(400, "Education is required");
//   }

//   education.forEach((edu) => {
//     if (!edu.institution || !edu.degree) {
//       throw new ApiError(400, "Please provide all the details");
//     }
//     if (
//       !edu.startDate ||
//       !edu.endDate ||
//       !edu.score ||
//       edu.score < 0 ||
//       edu.score > 100 ||
//       edu.startDate > edu.endDate
//     ) {
//       throw new ApiError(400, "Please provide valid score and dates");
//     }
//   });

//   if (!bio) {
//     throw new ApiError(400, "Bio is required");
//   }

//   if (bio.length > 500) {
//     throw new ApiError(400, "Bio should be less than 500 characters");
//   }

//   if (projects.size > 0) {
//     projects.forEach((project) => {
//       if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
//         throw new ApiError(400, "Please provide all the details");
//       }
//       if (project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
//         throw new ApiError(400, "Please provide valid project link");
//       }
//       if (project.startDate > project.endDate) {
//         throw new ApiError(400, "Please provide valid dates");
//       }
//     });
//   }

//   const user = await User.findOneAndUpdate(
//     { username: req.user.username },
//     {
//       name: name,
//       username: username,
//       linkedinLink: linkedinLink,
//       githubLink: githubLink,
//       portfolioLink: portfolioLink,
//       skillsProficientAt: skillsProficientAt,
//       skillsToLearn: skillsToLearn,
//       education: education,
//       bio: bio,
//       projects: projects,
//     }
//   );

//   if (!user) {
//     throw new ApiError(500, "Error in saving user details");
//   }

//   return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
// });

export const uploadPic = asyncHandler(async (req, res) => {
  console.log("\n******** Inside uploadPic Controller function ********");

  const LocalPath = req.files?.picture[0]?.path;

  if (!LocalPath) {
    throw new ApiError(400, "Picture file is required");
  }

  // Get current user to find old picture URL
  const currentUser = await User.findOne({ username: req.user.username });

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Delete old picture from Cloudinary if it exists
  if (currentUser.picture && currentUser.picture !== "") {
    try {
      const { deleteFromCloudinary } = await import("../../config/connectCloudinary.js");
      const result = await deleteFromCloudinary(currentUser.picture);

      if (result) {
        console.log("Old profile picture deleted from Cloudinary");
      } else {
        console.log("Failed to delete old profile picture from Cloudinary");
      }
    } catch (error) {
      console.error("Error deleting old profile picture:", error);
      // Continue with upload even if deletion fails
    }
  }

  // Upload new picture to Cloudinary
  const picture = await uploadOnCloudinary(LocalPath);

  if (!picture || !picture.url) {
    throw new ApiError(500, "Error uploading picture to cloud storage");
  }

  // Update user's picture in database
  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { picture: picture.url },
    { new: true }
  ).select('-password -resetPasswordToken -resetPasswordExpires -__v');

  if (!user) {
    throw new ApiError(500, "Failed to update user picture in database");
  }

  res.status(200).json(
    new ApiResponse(200, { url: picture.url, user }, "Picture uploaded successfully")
  );
});

export const removePic = asyncHandler(async (req, res) => {
  console.log("\n******** Inside removePic Controller function ********");

  // Get current user to find old picture URL
  const currentUser = await User.findOne({ username: req.user.username });

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Delete old picture from Cloudinary if it exists
  if (currentUser.picture && currentUser.picture !== "") {
    try {
      const { deleteFromCloudinary } = await import("../../config/connectCloudinary.js");
      const result = await deleteFromCloudinary(currentUser.picture);

      if (result) {
        console.log("Old profile picture deleted from Cloudinary");
      } else {
        console.log("Failed to delete old profile picture from Cloudinary");
      }
    } catch (error) {
      console.error("Error deleting old profile picture:", error);
      // Continue even if Cloudinary deletion fails
    }
  }

  // Update user's picture to empty string in database
  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { picture: "" },
    { new: true }
  ).select('-password -resetPasswordToken -resetPasswordExpires -__v');

  if (!user) {
    throw new ApiError(500, "Failed to remove user picture");
  }

  res.status(200).json(
    new ApiResponse(200, { user }, "Picture removed successfully")
  );
});

export const uploadVid = asyncHandler(async (req, res) => {
  console.log("\n******** Inside uploadVid Controller function ********");

  const LocalPath = req.files?.video[0]?.path;

  if (!LocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  // Get current user to find old video URL
  const currentUser = await User.findOne({ username: req.user.username });

  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  // Delete old video from Cloudinary if it exists
  if (currentUser.tutorialVideo && currentUser.tutorialVideo !== "") {
    try {
      const { deleteFromCloudinary } = await import("../../config/connectCloudinary.js");
      await deleteFromCloudinary(currentUser.tutorialVideo);
      console.log("Old tutorial video deleted from Cloudinary");
    } catch (error) {
      console.error("Error deleting old tutorial video:", error);
    }
  }

  // Upload new video to Cloudinary
  const video = await uploadOnCloudinary(LocalPath);

  if (!video || !video.url) {
    throw new ApiError(500, "Error uploading video to cloud storage");
  }

  // Update user's tutorialVideo in database
  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { tutorialVideo: video.url },
    { new: true }
  ).select('-password -resetPasswordToken -resetPasswordExpires -__v');

  res.status(200).json(
    new ApiResponse(200, { url: video.url, user }, "Tutorial video uploaded successfully")
  );
});


export const discoverUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  const currentUser = req.user;
  const myTeachableSkills = currentUser.skillsProficientAt.map(s => s.name);
  const myWantedSkills = currentUser.skillsToLearn.map(s => s.name);

  // Base query: excluded self, banned, deleted
  const baseQuery = {
    username: { $ne: currentUser.username },
    role: { $ne: "admin" },
    status: { $nin: ["banned", "deleted"] },
    isDeleted: { $ne: true }
  };

  if (search) {
    const safeSearch = escapeRegex(search.slice(0, 100));
    const searchRegex = new RegExp(safeSearch, "i");
    baseQuery.$or = [
      { name: searchRegex },
      { username: searchRegex },
      { "skillsProficientAt.name": searchRegex }
    ];
  }

  // We use aggregation to add a "matchScore"
  // Match Score Calculation:
  // +2 for each skill they teach that I want to learn
  // +1 for each skill they want to learn that I teach
  // This prioritizes users who can actually help me (Mutual Swap)
  
  const users = await User.aggregate([
    { $match: baseQuery },
    {
      $addFields: {
        matchScore: {
          $add: [
            {
              $multiply: [
                {
                  $size: {
                    $setIntersection: ["$skillsProficientAt.name", myWantedSkills]
                  }
                },
                2 // Higher weight for what they teach and I want
              ]
            },
            {
              $size: {
                $setIntersection: ["$skillsToLearn.name", myTeachableSkills]
              }
            }
          ]
        }
      }
    },
    { $sort: { matchScore: -1, rating: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        password: 0,
        phone: 0,
        personalInfo: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
        __v: 0
      }
    }
  ]);

  const total = await User.countDocuments(baseQuery);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      },
      "Recommended users fetched successfully"
    )
  );
});

export const sendScheduleMeet = asyncHandler(async (req, res) => {
  console.log("******** Inside sendScheduleMeet Function *******");

  const { date, time, username } = req.body;
  if (!date || !time || !username) {
    throw new ApiError(400, "Please provide all the details");
  }

  // ✅ FIX: Prevent self-meet spam
  if (username === req.user.username) {
    throw new ApiError(400, "You cannot schedule a meet with yourself");
  }

  // ✅ FIX: Cooldown check — prevent spamming the same person
  const cooldownKey = `${req.user.username}->${username}`;
  const lastSent = scheduleMeetCooldown.get(cooldownKey);
  if (lastSent && Date.now() - lastSent < SCHEDULE_MEET_COOLDOWN_MS) {
    const waitMinutes = Math.ceil((SCHEDULE_MEET_COOLDOWN_MS - (Date.now() - lastSent)) / 60000);
    throw new ApiError(429, `Please wait ${waitMinutes} more minute(s) before sending another meeting request to this user.`);
  }

  const user = await User.findOne({ username: username });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const to = user.email;
  const subject = "Request for Scheduling a meeting";
  const message = `${req.user.name} has requested for a meet at ${time} on ${date}. Please respond to the request.`;

  await sendMail(to, subject, message);

  // Record cooldown timestamp
  scheduleMeetCooldown.set(cooldownKey, Date.now());
  // Auto-clean the map entry after cooldown expires
  setTimeout(() => scheduleMeetCooldown.delete(cooldownKey), SCHEDULE_MEET_COOLDOWN_MS);

  return res.status(200).json(new ApiResponse(200, null, "Email sent successfully"));
});

// Skill Gain: Find mentors/teachers
export const getSkillGainExperts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  const currentUser = req.user;
  const myWantedSkills = currentUser.skillsToLearn.map(s => s.name);

  const baseQuery = {
    username: { $ne: currentUser.username },
    status: { $nin: ["banned", "deleted"] },
    isDeleted: { $ne: true },
    "preferences.rates.mentorship": { $gt: 0 }
  };

  if (search) {
    baseQuery["skillsProficientAt.name"] = { $regex: escapeRegex(search.slice(0, 100)), $options: "i" };
  }

  // Use aggregation to prioritize experts who teach what I want to learn
  const users = await User.aggregate([
    { $match: baseQuery },
    {
      $addFields: {
        relevanceScore: {
          $size: {
            $setIntersection: ["$skillsProficientAt.name", myWantedSkills]
          }
        }
      }
    },
    { $sort: { relevanceScore: -1, rating: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        name: 1,
        username: 1,
        picture: 1,
        skillsProficientAt: 1,
        "preferences.rates.mentorship": 1,
        rating: 1
      }
    }
  ]);

  const total = await User.countDocuments(baseQuery);

  return res.status(200).json(
    new ApiResponse(
      200, 
      { 
        users, 
        pagination: { current: page, pages: Math.ceil(total / limit), total } 
      }, 
      "Mentors matched to your goals fetched successfully"
    )
  );
});

// Utilization: Find service providers
export const getUtilizationProviders = asyncHandler(async (req, res) => {
  const { type } = req.query; // 'Instant Help' or 'Hire Expert'
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // ✅ FIX: cap at 100
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  if (!["Instant Help", "Hire Expert"].includes(type)) {
    throw new ApiError(400, "Invalid utilization type");
  }

  const query = {
    username: { $ne: req.user.username },
    status: { $nin: ["banned", "deleted"] },
    isDeleted: { $ne: true },
    "preferences.utilization": type
  };

  if (search) {
    // ✅ FIX: Escape regex special chars + cap length — prevents ReDoS attack (same as discoverUsers)
    const safeSearch = escapeRegex(search.slice(0, 100));
    const searchRegex = new RegExp(safeSearch, "i");
    query.$or = [
      { name: searchRegex },
      { "skillsProficientAt.name": searchRegex }
    ];
  }

  const users = await User.find(query)
    .select("name username picture skillsProficientAt preferences.rates preferences.utilization rating")
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, { users, pagination: { current: page, pages: Math.ceil(total / limit), total } }, "Providers fetched successfully")
  );
});


