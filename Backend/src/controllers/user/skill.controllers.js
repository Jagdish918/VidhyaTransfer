import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { UnRegisteredUser } from "../../models/unRegisteredUser.model.js";

// Add current skill
export const addCurrentSkill = asyncHandler(async (req, res) => {
  const { name, category, proficiency } = req.body;
  const userId = req.user._id || req.user.id;

  if (!name) {
    throw new ApiError(400, "Skill name is required");
  }

  const validProficiency = ["Beginner", "Intermediate", "Advanced", "Expert"];
  if (proficiency && !validProficiency.includes(proficiency)) {
    throw new ApiError(400, "Invalid proficiency level");
  }

  let user = await User.findById(userId);
  if (!user) {
    user = await UnRegisteredUser.findById(userId);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if skill already exists
  const existingSkill = user.skillsProficientAt.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );

  if (existingSkill) {
    throw new ApiError(409, "Skill already exists");
  }

  user.skillsProficientAt.push({
    name,
    category: category || "General",
    proficiency: proficiency || "Intermediate",
  });

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, user.skillsProficientAt, "Skill added successfully")
  );
});

// Update skill proficiency
export const updateSkillProficiency = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const { proficiency } = req.body;
  const userId = req.user._id || req.user.id;

  if (!proficiency) {
    throw new ApiError(400, "Proficiency is required");
  }

  const validProficiency = ["Beginner", "Intermediate", "Advanced", "Expert"];
  if (!validProficiency.includes(proficiency)) {
    throw new ApiError(400, "Invalid proficiency level");
  }

  let user = await User.findById(userId);
  if (!user) {
    user = await UnRegisteredUser.findById(userId);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const skill = user.skillsProficientAt.id(skillId);
  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  skill.proficiency = proficiency;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, skill, "Skill proficiency updated successfully")
  );
});

// Remove current skill
export const removeCurrentSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req.user._id || req.user.id;

  let user = await User.findById(userId);
  if (!user) {
    user = await UnRegisteredUser.findById(userId);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.skillsProficientAt = user.skillsProficientAt.filter(
    (skill) => skill._id.toString() !== skillId
  );

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, user.skillsProficientAt, "Skill removed successfully")
  );
});

// Add desired skill
export const addDesiredSkill = asyncHandler(async (req, res) => {
  const { name, proficiency, autoMatchTutors } = req.body;
  const userId = req.user._id || req.user.id;

  if (!name) {
    throw new ApiError(400, "Skill name is required");
  }

  let user = await User.findById(userId);
  if (!user) {
    user = await UnRegisteredUser.findById(userId);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const existingSkill = user.skillsToLearn.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );

  if (existingSkill) {
    throw new ApiError(409, "Skill already exists");
  }

  user.skillsToLearn.push({
    name,
    proficiency: proficiency || "Beginner",
    autoMatchTutors: autoMatchTutors || false,
  });

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, user.skillsToLearn, "Desired skill added successfully")
  );
});

// Remove desired skill
export const removeDesiredSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req.user._id || req.user.id;

  let user = await User.findById(userId);
  if (!user) {
    user = await UnRegisteredUser.findById(userId);
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.skillsToLearn = user.skillsToLearn.filter(
    (skill) => skill._id.toString() !== skillId
  );

  await user.save();

  const userData = { ...user.toObject() };
  if (userData.password) delete userData.password;

  return res.status(200).json(
    new ApiResponse(200, user.skillsToLearn, "Desired skill removed successfully")
  );
});


