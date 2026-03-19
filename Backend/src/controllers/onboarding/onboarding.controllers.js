import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { UnRegisteredUser } from "../../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../../utils/generateJWTToken.js";

// Helper to generate unique username
const generateUniqueUsername = async (name) => {
  let base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (base.length < 3) base = "user";
  let username = base;
  let count = 1;
  while (await User.findOne({ username })) {
    username = `${base}${count}`;
    count++;
  }
  return username;
};

// Step 1: Personal Info
export const updatePersonalInfo = asyncHandler(async (req, res) => {
  const { name, email, age, country } = req.body;
  const userEmail = req.user.email;
  const userId = req.user._id || req.user.id;

  if (!name || !email) {
    throw new ApiError(400, "Name and email are required");
  }

  if (!country) {
    throw new ApiError(400, "Country is required");
  }

  if (age && (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 150)) {
    throw new ApiError(400, "Please enter a valid age");
  }

  // Check if user is registered or unregistered
  let user = null;
  if (userId) {
    user = await User.findById(userId);
    if (!user) {
      user = await UnRegisteredUser.findById(userId);
    }
  } else if (userEmail) {
    user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await UnRegisteredUser.findOne({ email: userEmail });
    }
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.name = name;
  user.email = email;

  // Store in personalInfo object (Sprint 2 requirement)
  if (!user.personalInfo) {
    user.personalInfo = {};
  }
  user.personalInfo.age = age || null;
  user.personalInfo.country = country;

  user.onboardingStep = 1;

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, { user: userData, step: 1 }, "Personal info updated successfully")
  );
});

// Step 2: Skill Profile
export const updateSkillProfile = asyncHandler(async (req, res) => {
  const { currentSkills, desiredSkills } = req.body;
  const userEmail = req.user.email;
  const userId = req.user._id || req.user.id;

  if (!currentSkills || !Array.isArray(currentSkills) || currentSkills.length === 0) {
    throw new ApiError(400, "At least one current skill is required");
  }

  if (!desiredSkills || !Array.isArray(desiredSkills) || desiredSkills.length === 0) {
    throw new ApiError(400, "At least one desired skill is required");
  }

  // Validate skill structure
  currentSkills.forEach((skill) => {
    if (!skill.name) {
      throw new ApiError(400, "Skill name is required");
    }
    if (!["Beginner", "Intermediate", "Advanced", "Expert"].includes(skill.proficiency)) {
      throw new ApiError(400, "Invalid proficiency level");
    }
  });

  desiredSkills.forEach((skill) => {
    if (!skill.name) {
      throw new ApiError(400, "Desired skill name is required");
    }
  });

  let user = null;
  if (userId) {
    user = await User.findById(userId);
    if (!user) {
      user = await UnRegisteredUser.findById(userId);
    }
  } else if (userEmail) {
    user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await UnRegisteredUser.findOne({ email: userEmail });
    }
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.skillsProficientAt = currentSkills;
  user.skillsToLearn = desiredSkills;
  user.onboardingStep = 2;

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, { user: userData, step: 2 }, "Skill profile updated successfully")
  );
});


// Step 3: Preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  const userEmail = req.user.email;
  const userId = req.user._id || req.user.id;

  // Validate preferences structure (Sprint 2)
  if (preferences) {
    if (preferences.availability !== undefined && (isNaN(preferences.availability) || preferences.availability < 0)) {
      throw new ApiError(400, "Availability must be a positive number");
    }
    if (preferences.utilization && Array.isArray(preferences.utilization)) {
      const validOptions = ["Instant Help", "Hire Expert", "Events"];
      const invalid = preferences.utilization.some(u => !validOptions.includes(u));
      if (invalid) {
        throw new ApiError(400, "Invalid utilization option selected");
      }
    }

    // Validate rates
    if (preferences.rates) {
      if (preferences.rates.mentorship && (isNaN(preferences.rates.mentorship) || preferences.rates.mentorship < 0)) {
        throw new ApiError(400, "Mentorship rate must be a valid positive number");
      }
    }
  }

  let user = null;
  let isUnregistered = false;

  if (userId) {
    user = await User.findById(userId);
    if (!user) {
      user = await UnRegisteredUser.findById(userId);
      isUnregistered = true;
    }
  } else if (userEmail) {
    user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await UnRegisteredUser.findOne({ email: userEmail });
      isUnregistered = true;
    }
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update preferences logic
  user.preferences = {
    ...user.preferences,
    ...preferences,
  };

  // Update primary goal if provided (passed at top level of body)
  if (req.body.primaryGoal) {
    if (!["Peer Swap", "Skill Gain"].includes(req.body.primaryGoal)) {
      throw new ApiError(400, "Invalid primary goal");
    }
    user.primaryGoal = req.body.primaryGoal;
  }

  user.onboardingStep = 3;
  user.onboardingCompleted = true;

  await user.save();

  let finalUser = user;

  // If user was unregistered, migrate to User collection
  if (isUnregistered) {
    const username = await generateUniqueUsername(user.name);

    // Create new User
    const newUser = await User.create({
      name: user.name,
      email: user.email,
      password: user.password,
      picture: user.picture,
      username: username,
      tokenVersion: 0, // Initial version
      personalInfo: user.personalInfo,
      skillsProficientAt: user.skillsProficientAt,
      skillsToLearn: user.skillsToLearn,
      preferences: user.preferences,
      primaryGoal: user.primaryGoal,
      onboardingCompleted: true,
      onboardingStep: 3,
    });

    // Delete unregistered user
    await UnRegisteredUser.findByIdAndDelete(user._id);
    finalUser = newUser;
  }

  // Generate proper access token for User (username-based)
  const IS_PROD = process.env.NODE_ENV === "production";
  const jwtToken = generateJWTToken_username(finalUser);
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Set the main login cookie
  res.cookie("accessToken", jwtToken, {
    httpOnly: true,
    expires: expiryDate,
    secure: IS_PROD,
    sameSite: IS_PROD ? "Strict" : "Lax",
    path: "/",
  });

  // Set a non-HTTP-only hint cookie for Frontend/Persistence
  res.cookie("hasSession", "true", {
    expires: expiryDate,
    secure: IS_PROD,
    sameSite: IS_PROD ? "Strict" : "Lax",
    path: "/",
  });

  // Clear registration token with correct options
  res.clearCookie("accessTokenRegistration", { path: "/" });

  // Remove ALL sensitive fields before sending
  const userData = { ...finalUser.toObject() };
  delete userData.password;
  delete userData.resetPasswordToken;
  delete userData.resetPasswordExpires;
  delete userData.__v;

  return res.status(200).json(
    new ApiResponse(200, { user: userData }, "Preferences updated and onboarding completed")
  );
});

// Get onboarding status
export const getOnboardingStatus = asyncHandler(async (req, res) => {
  const userEmail = req.user.email;
  const userId = req.user._id || req.user.id;

  let user = null;
  if (userId) {
    user = await User.findById(userId);
    if (!user) {
      user = await UnRegisteredUser.findById(userId);
    }
  } else if (userEmail) {
    user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await UnRegisteredUser.findOne({ email: userEmail });
    }
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      completed: user.onboardingCompleted,
      step: user.onboardingStep || 0,
    }, "Onboarding status retrieved")
  );
});


