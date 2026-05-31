const multer = require('multer');

// Configure multer to use memory storage.
// The image.service.js will handle saving to disk to ensure directory structures exist.
const storage = multer.memoryStorage();

// Allowed file types as per requirements
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// File filter to restrict uploads to specific image types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // We pass a custom error property so we can handle it in the endpoint or error middleware
    const error = new Error('Invalid file type. Only jpg, jpeg, png, and webp are allowed.');
    error.statusCode = 400; // Bad Request
    cb(error, false);
  }
};

const uploadOptions = {
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
};

const uploadMiddleware = multer(uploadOptions);

module.exports = uploadMiddleware;
