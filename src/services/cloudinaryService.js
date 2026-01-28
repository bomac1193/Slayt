const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
// Cloudinary credentials should be set in .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadBuffer = async (buffer, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'slayt',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        transformation: options.transformation,
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload a file from local path to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFile = async (filePath, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  return cloudinary.uploader.upload(filePath, {
    folder: options.folder || 'slayt',
    resource_type: options.resourceType || 'auto',
    public_id: options.publicId,
    transformation: options.transformation,
    ...options,
  });
};

/**
 * Upload a video file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadVideo = async (filePath, options = {}) => {
  return uploadFile(filePath, {
    ...options,
    resource_type: 'video',
    folder: options.folder || 'slayt/videos',
  });
};

/**
 * Upload an image file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadImage = async (filePath, options = {}) => {
  return uploadFile(filePath, {
    ...options,
    resource_type: 'image',
    folder: options.folder || 'slayt/images',
  });
};

/**
 * Upload a thumbnail to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadThumbnail = async (filePath, options = {}) => {
  return uploadFile(filePath, {
    ...options,
    resource_type: 'image',
    folder: options.folder || 'slayt/thumbnails',
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
    ],
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Delete options
 * @returns {Promise<Object>} Delete result
 */
const deleteFile = async (publicId, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary not configured');
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: options.resourceType || 'image',
    ...options,
  });
};

/**
 * Get optimized URL for an image
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  });
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // Extract public ID from URL
  // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{format}
  const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadBuffer,
  uploadFile,
  uploadVideo,
  uploadImage,
  uploadThumbnail,
  deleteFile,
  getOptimizedUrl,
  extractPublicId,
};
