import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'streetlight-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
    resource_type: 'image'
  }
});

// Configure local storage (fallback)
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`), false);
  }
};

// Create multer instances
const cloudinaryUpload = multer({
  storage: cloudinaryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

const localUpload = multer({
  storage: localStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  }
});

// Process image with Sharp
const processImage = async (filePath, options = {}) => {
  const {
    maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH) || 1920,
    quality = parseInt(process.env.IMAGE_QUALITY) || 85,
    outputFormat = 'jpeg'
  } = options;

  try {
    const processedImage = sharp(filePath)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFormat(outputFormat);

    const metadata = await sharp(filePath).metadata();
    
    // Generate thumbnail
    const thumbnail = sharp(filePath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 70 });

    return {
      processedImage,
      thumbnail,
      metadata
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'streetlight-reports') => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' }
      ]
    });

    // Generate thumbnail URL
    const thumbnailUrl = cloudinary.v2.url(result.public_id, {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 70,
      format: 'jpg'
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      thumbnail_url: thumbnailUrl,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Check image brightness
const checkImageBrightness = async (filePath) => {
  try {
    const image = sharp(filePath);
    const stats = await image.stats();
    
    // Calculate average brightness (0-255)
    const channels = stats.channels;
    const brightness = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
    
    return {
      brightness: Math.round(brightness),
      isTooDark: brightness < 50, // Threshold for dark images
      isTooBright: brightness > 200 // Threshold for bright images
    };
  } catch (error) {
    console.error('Error checking image brightness:', error);
    return null;
  }
};

// Check image blur
const checkImageBlur = async (filePath) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Simple blur detection (can be enhanced)
    const isBlurry = metadata.width < 640 || metadata.height < 480;
    
    return {
      width: metadata.width,
      height: metadata.height,
      isTooSmall: metadata.width < 640 || metadata.height < 480,
      isBlurry: isBlurry,
      resolution: `${metadata.width}x${metadata.height}`
    };
  } catch (error) {
    console.error('Error checking image blur:', error);
    return null;
  }
};

// Get image orientation
const getImageOrientation = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      orientation: metadata.orientation || 1,
      isPortrait: metadata.height > metadata.width,
      isLandscape: metadata.width > metadata.height,
      aspectRatio: metadata.width / metadata.height
    };
  } catch (error) {
    console.error('Error getting image orientation:', error);
    return null;
  }
};

// Validate image quality
const validateImageQuality = async (filePath) => {
  const validations = {
    brightness: await checkImageBrightness(filePath),
    blur: await checkImageBlur(filePath),
    orientation: await getImageOrientation(filePath)
  };

  const warnings = [];
  const errors = [];

  // Check brightness
  if (validations.brightness?.isTooDark) {
    warnings.push('Image may be too dark. Try capturing with better lighting.');
  }

  // Check size
  if (validations.blur?.isTooSmall) {
    warnings.push('Image resolution is low. Try getting closer to the streetlight.');
  }

  // Check orientation
  if (validations.orientation?.isPortrait) {
    warnings.push('Portrait orientation detected. Landscape is better for streetlight photos.');
  }

  return {
    validations,
    warnings,
    errors,
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0
  };
};

export {
  cloudinaryUpload,
  localUpload,
  processImage,
  uploadToCloudinary,
  deleteFromCloudinary,
  validateImageQuality,
  checkImageBrightness,
  checkImageBlur,
  getImageOrientation
};