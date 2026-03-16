/**
 * Sanitize user data before storing in localStorage.
 * ✅ FIX: Uses an ALLOWLIST — only explicitly safe fields are stored.
 * This is safer than a denylist because any new sensitive DB field (otp, tokenVersion etc.)
 * can't accidentally leak into localStorage through a future API endpoint that forgets to strip it.
 */
export const sanitizeUserData = (userData) => {
    if (!userData) return null;

    // Only these fields are safe to store in the browser
    const {
        _id,
        name,
        username,
        email,
        role,
        picture,
        tutorialVideo,
        bio,
        rating,
        credits,
        linkedinLink,
        githubLink,
        portfolioLink,
        skillsProficientAt,
        skillsToLearn,
        preferences,
        education,
        projects,
        onboardingCompleted,
        onboardingStep,
        isEmailVerified,
        status,
        termsAccepted,
        timezone,
    } = userData;

    return {
        _id, name, username, email, role, picture, tutorialVideo, bio,
        rating, credits, linkedinLink, githubLink, portfolioLink,
        skillsProficientAt, skillsToLearn, preferences, education, projects,
        onboardingCompleted, onboardingStep, isEmailVerified, status,
        termsAccepted, timezone,
    };
};

/**
 * Get sanitized user data from localStorage
 */
export const getSanitizedUserData = () => {
    try {
        const userInfoString = localStorage.getItem("userInfo");
        if (!userInfoString) return null;

        const userData = JSON.parse(userInfoString);
        return sanitizeUserData(userData);
    } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
    }
};

/**
 * Store sanitized user data in localStorage
 */
export const storeSanitizedUserData = (userData) => {
    const sanitized = sanitizeUserData(userData);
    if (sanitized) {
        localStorage.setItem("userInfo", JSON.stringify(sanitized));
    }
};
