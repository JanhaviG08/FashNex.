import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from "dotenv"

dotenv.config()
// ✅ Configure once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ✅ OLD method (for admin panel - file path)
export const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null

    const uploadResult = await cloudinary.uploader.upload(filePath)
    fs.unlinkSync(filePath)

    return uploadResult.secure_url
  } catch (error) {
    fs.unlinkSync(filePath)
    console.log(error)
    return ""
  }
}

// ✅ NEW method support (for buffer upload)
export default cloudinary