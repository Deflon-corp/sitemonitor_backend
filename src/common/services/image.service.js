const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Service to handle saving uploaded images and returning their metadata.
 */
class ImageService {
  /**
   * Saves an uploaded image to the specified folder and returns metadata.
   * 
   * @param {Object} file - The file object from multer memory storage
   * @param {string} folder - The target folder name under "uploads" (e.g., "admins", "users")
   * @returns {Object} Image metadata compatible with the mongoose schemas
   */
  async saveImage(file, folder, tenantName = null) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Determine the base upload directory relative to project root
    // Assuming this file is at src/common/services/image.service.js
    const baseUploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
    
    // Resolve the target folder (e.g., uploads/tenantName/admins or uploads/admins)
    const relativePath = tenantName ? path.join(tenantName, folder) : folder;
    const targetDir = path.join(baseUploadDir, relativePath);

    // Create directories if they do not exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Generate a unique filename using UUID and original extension
    const extension = path.extname(file.originalname).toLowerCase() || '';
    // Strip the dot for the file_type field
    const fileType = extension.replace('.', ''); 
    
    const uniqueFileName = `${uuidv4()}${extension}`;
    const filePath = path.join(targetDir, uniqueFileName);

    // Write file from buffer to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Construct the file URL (handling Windows backslashes for URL)
    const port = process.env.USER_MS_PORT || 3000;
    const urlPath = relativePath.replace(/\\/g, '/');
    const fileUrl = `http://localhost:${port}/uploads/${urlPath}/${uniqueFileName}`;

    // Return the required metadata object
    return {
      file_name: uniqueFileName,
      file_path: filePath,
      file_url: fileUrl,
      file_size: file.size,
      file_type: fileType,
      created_at: new Date(),
      updated_at: new Date()
    };
  }
  
  /**
   * Helper function to safely delete an image from disk if needed.
   * 
   * @param {string} filePath - The absolute file path to delete
   */
  async deleteImage(filePath) {
    if (!filePath) return;
    
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete image at ${filePath}:`, error.message);
    }
  }
}

module.exports = new ImageService();
