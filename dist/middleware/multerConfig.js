import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Adjust this path if your 'uploads' folder is not in the project root
        cb(null, path.join(__dirname, '../../uploads/images')); // Go up two levels to project root/uploads/images
    },
    // Define how the file should be named
    filename: (req, file, cb) => {
        // Example: Use a unique name (timestamp + original name) to prevent collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept file
    }
    else {
        // Optionally, delete the rejected file if it was partially uploaded
        // fs.unlink(file.path, () => {}); // Requires 'fs' import
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed!'));
    }
};
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});
export default upload;
