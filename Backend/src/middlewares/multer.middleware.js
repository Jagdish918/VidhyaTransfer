import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Sanitize original filename to prevent path traversal
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

// Allowed MIME types for images and videos
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type: "${file.mimetype}". Only images (JPEG, PNG, WEBP, GIF) and videos (MP4, WEBM, OGG, MOV) are allowed.`
            ),
            false
        );
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB max per file
        files: 5,                    // ✅ FIX: Allow up to 5 files (post route allows 4 attachments)
    },
});
