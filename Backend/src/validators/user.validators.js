import { z } from "zod";

/**
 * User Route Schema Definitions
 */

const skillSchema = z.object({
    name: z.string().min(1, "Skill name is required"),
    category: z.string().optional(),
    proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate"),
});

const educationSchema = z.object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    startDate: z.string().pipe(z.coerce.date()),
    endDate: z.string().pipe(z.coerce.date()),
    score: z.number().min(0).max(100).optional(),
    description: z.string().optional(),
});

const projectSchema = z.object({
    title: z.string().min(1, "Project title is required"),
    description: z.string().min(1, "Project description is required"),
    projectLink: z.string().url("Please provide a valid project URL"),
    startDate: z.string().pipe(z.coerce.date()),
    endDate: z.string().pipe(z.coerce.date()),
    techStack: z.array(z.string()).optional(),
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(3, "Name must be at least 3 characters long").optional(),
        username: z.string().min(3, "Username must be at least 3 characters long").optional(),
        bio: z.string().max(500, "Bio must be under 500 characters").optional(),
        linkedinLink: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
        githubLink: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
        portfolioLink: z.string().url("Invalid Portfolio URL").optional().or(z.literal("")),
        skillsProficientAt: z.array(skillSchema).optional(),
        skillsToLearn: z.array(skillSchema).optional(),
        education: z.array(educationSchema).optional(),
        projects: z.array(projectSchema).optional(),
    }),
});

export const discoverUsersSchema = z.object({
    query: z.object({
        page: z.string().optional().transform(v => parseInt(v) || 1),
        limit: z.string().optional().transform(v => parseInt(v) || 20),
        search: z.string().optional(),
    }),
});
