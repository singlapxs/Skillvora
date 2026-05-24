const cloudinary = require('cloudinary').v2;

// Configure Cloudinary SDK only if credentials exist in the environment
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * @desc    Upload base64 image payload to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
exports.uploadImage = async (req, res, next) => {
  try {
    const { image } = req.body; // Expects "data:image/png;base64,..."

    if (!image) {
      return res.status(400).json({ success: false, message: 'Please provide an image payload in base64 format.' });
    }

    // Fallback gracefully if Cloudinary credentials are not set in the environment
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('[Upload System] Warning: Cloudinary not configured. Falling back to raw base64 data transfer.');
      return res.status(200).json({
        success: true,
        message: 'Image received. Cloudinary credentials not configured, falling back to base64.',
        url: image
      });
    }

    console.log('[Upload System] Initializing Cloudinary upload sequence...');
    const result = await cloudinary.uploader.upload(image, {
      folder: 'skillvora',
      resource_type: 'image'
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary!',
      url: result.secure_url
    });
  } catch (error) {
    console.error(`[Upload System Error] Cloudinary upload failed: ${error.message}`);
    next(error);
  }
};
