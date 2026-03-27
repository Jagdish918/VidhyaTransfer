import { z } from "zod";

/**
 * Report Validation
 */
export const createReportSchema = z.object({
    body: z.object({
        username: z.string().min(1, "Reporter username is required"),
        reportedUsername: z.string().min(1, "Target username is required"),
        issue: z.enum(["Personal conduct", "Professional expertise", "Others"]),
        issueDescription: z.string().min(10, "Description must be at least 10 characters long").max(1000),
    }),
});

/**
 * Rating Validation
 */
export const createRatingSchema = z.object({
    body: z.object({
        targetUsername: z.string().min(1, "Target username is required"),
        rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
        description: z.string().min(5, "Feedback description is required").max(1000),
    }),
});

/**
 * Onboarding Validation
 */
export const onboardingStep1Schema = z.object({
    body: z.object({
        age: z.number().min(13, "You must be at least 13 years old").max(120),
        country: z.string().min(1, "Country is required"),
        bio: z.string().min(10, "Bio should be descriptive (min 10 chars)").max(500),
    }),
});

export const onboardingStep2Schema = z.object({
    body: z.object({
        skillsProficientAt: z.array(z.object({
            name: z.string().min(1),
            category: z.string().optional(),
            proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
        })).min(1, "Please add at least one skill you are proficient in"),
    }),
});

/**
 * Event Validation
 */
export const eventSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters").max(100),
        shortDescription: z.string().min(5, "Short description is required").max(300),
        description: z.string().min(10, "Description must be at least 10 characters").max(4000),
        date: z.string().pipe(z.coerce.date()),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
        location: z.string().min(1, "Location is required"),
        credits: z.coerce.number().min(0).default(0),
        maxParticipants: z.coerce.number().min(1).default(50),
        tags: z.array(z.string()).optional(),
        learningOutcomes: z.array(z.string()).optional(),
        link: z.string().optional(),
        image: z.string().optional(),
    }),
});
