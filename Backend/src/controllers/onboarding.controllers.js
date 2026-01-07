import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";

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
    if (preferences.mode && !["Online", "Instant Help", "Events"].includes(preferences.mode)) {
      throw new ApiError(400, "Invalid mode. Must be Online, Instant Help, or Events");
    }
  }

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

  // Update preferences object (Sprint 2 structure)
  user.preferences = {
    ...user.preferences,
    ...preferences,
  };
  user.onboardingStep = 3;
  user.onboardingCompleted = true;

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, { user: userData }, "Preferences updated successfully")
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


