import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { Report } from "../../models/report.model.js";

export const createReport = asyncHandler(async (req, res, next) => {
  console.log("\n******** Inside createReport Controller function ********");
  const { username, reportedUsername, issue, issueDescription } = req.body;

  if (!username || !reportedUsername || !issue || !issueDescription) {
    return next(new ApiError(400, "Please fill all the details"));
  }

  // ✅ FIX: Prevent self-reporting
  if (username === reportedUsername) {
    return next(new ApiError(400, "You cannot report yourself"));
  }

  // ✅ FIX: Limit issue description length
  if (issueDescription.length > 1000) {
    return next(new ApiError(400, "Issue description must be under 1000 characters"));
  }

  const reporter = await User.findOne({ username: username });
  const reported = await User.findOne({ username: reportedUsername });

  if (!reporter || !reported) {
    return next(new ApiError(400, "User not found"));
  }

  // ✅ SECURITY: Verify the reporter is actually the authenticated user
  if (reporter._id.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, "You can only file reports on your own behalf"));
  }

  // The unique index in the Report model handles the race condition.
  let report;
  try {
    report = await Report.create({
      reporter: reporter._id,
      reported: reported._id,
      nature: issue,
      description: issueDescription,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(429, "You have already submitted a report against this user"));
    }
    return next(error);
  }

  res.status(201).json(new ApiResponse(201, report, "User Reported successfully"));
});
