import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("File path is required");
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully on Cloudinary", response.url);
    return response;
  } catch (error) {
    console.log("Error inside Cloudinary upload function: ", error);
    // remove the locally saved temporary file as the upload operation got failed
    return null;
  } finally {
    // ✅ FIX: Guard against ENOENT if the file was never created or already removed
    try { fs.unlinkSync(localFilePath); } catch (_) { /* already cleaned or never existed */ }
  }
};

const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) {
      console.log("No file URL provided for deletion");
      return null;
    }

    // Extract public_id from Cloudinary URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
    // Public ID: sample
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      console.log("Invalid Cloudinary URL format");
      return null;
    }

    // Get everything after 'upload/v{version}/' or 'upload/'
    let publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');

    // Remove file extension
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.')) || publicIdWithExtension;

    // Determine resource type from URL
    let resourceType = 'image';
    if (fileUrl.includes('/video/')) {
      resourceType = 'video';
    } else if (fileUrl.includes('/raw/')) {
      resourceType = 'raw';
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("File deleted from Cloudinary:", publicId, response);
    return response;
  } catch (error) {
    console.log("Error deleting file from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };


// use envalid (package) to validate env variables