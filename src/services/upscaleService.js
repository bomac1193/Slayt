const Replicate = require('replicate');
const cloudinaryService = require('./cloudinaryService');
const { cloudinary } = cloudinaryService;
const axios = require('axios');
const sharp = require('sharp');

class UpscaleService {
  constructor() {
    this.replicate = null;
  }

  getReplicateClient() {
    if (this.replicate) return this.replicate;

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN is required for Replicate upscaling');
    }

    this.replicate = new Replicate({ auth: token });
    return this.replicate;
  }

  /**
   * Resolve a mediaUrl to a full public URL.
   * Local paths like /uploads/... need the server base URL prepended.
   * For local files, upload to Cloudinary first so external services can access them.
   */
  async resolveToPublicUrl(mediaUrl) {
    // Already a full URL
    if (mediaUrl.startsWith('http')) {
      return mediaUrl;
    }

    // Local file — read from disk and upload to Cloudinary
    const fs = require('fs');
    const path = require('path');
    const localPath = path.join(__dirname, '../..', mediaUrl);

    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }

    const result = await cloudinaryService.uploadFile(localPath, {
      folder: 'slayt/originals',
    });

    return result.secure_url;
  }

  /**
   * Upscale image using Replicate's Real-ESRGAN model (4x)
   * @param {string} imageUrl - URL of the image to upscale
   * @returns {string} URL of the upscaled image
   */
  async upscaleWithReplicate(imageUrl) {
    const replicate = this.getReplicateClient();
    const publicUrl = await this.resolveToPublicUrl(imageUrl);

    const output = await replicate.run(
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      {
        input: {
          image: publicUrl,
          scale: 4,
          face_enhance: false,
        },
      }
    );

    const tempUrl = typeof output === 'string' ? output : output?.[0] || output;
    if (!tempUrl) {
      throw new Error('Replicate returned no output');
    }

    // Replicate URLs are temporary — download and re-upload to Cloudinary
    // for a permanent URL that won't expire
    const response = await axios.get(tempUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const result = await cloudinaryService.uploadBuffer(buffer, {
      folder: 'slayt/upscaled',
      resourceType: 'image',
    });

    return result.secure_url;
  }

  /**
   * Upscale image using Cloudinary — upload at 2x resolution via sharp then upload.
   * Does not require AI add-on.
   * @param {string} imageUrl - URL of the image to upscale
   * @returns {string} URL of the upscaled image
   */
  async upscaleWithCloudinary(imageUrl) {
    if (!cloudinaryService.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    // Get image buffer — either from URL or local file
    let imageBuffer;
    if (imageUrl.startsWith('http')) {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } else {
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(__dirname, '../..', imageUrl);
      if (!fs.existsSync(localPath)) {
        throw new Error('Source image file not found on disk');
      }
      imageBuffer = fs.readFileSync(localPath);
    }

    // Get dimensions and upscale 2x with sharp + two-pass sharpening
    const metadata = await sharp(imageBuffer).metadata();

    // Pass 1: upscale with structure-level sharpening (larger radius, recovers edges)
    const pass1 = await sharp(imageBuffer)
      .resize({
        width: metadata.width * 2,
        height: metadata.height * 2,
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 1.5, m1: 1.8, m2: 0.6, x1: 2.0, y2: 10, y3: 20 })
      .toBuffer();

    // Pass 2: fine detail sharpening (smaller radius, crisps texture without noise)
    let pipeline = sharp(pass1)
      .sharpen({ sigma: 0.5, m1: 1.0, m2: 0.3, x1: 2.0, y2: 10, y3: 20 });

    // Use JPEG for large images to stay under Cloudinary's 10MB limit
    const upscaledPixels = (metadata.width * 2) * (metadata.height * 2);
    if (upscaledPixels > 1000000) {
      pipeline = pipeline.jpeg({ quality: 95, mozjpeg: true });
    } else {
      pipeline = pipeline.png({ compressionLevel: 6 });
    }

    const upscaledBuffer = await pipeline.toBuffer();

    // Upload upscaled image to Cloudinary
    const result = await cloudinaryService.uploadBuffer(upscaledBuffer, {
      folder: 'slayt/upscaled',
      resourceType: 'image',
    });

    return result.secure_url;
  }
}

module.exports = new UpscaleService();
