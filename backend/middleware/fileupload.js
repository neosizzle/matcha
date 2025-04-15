
const multer = require('multer');
const path = require('path');

const MAX_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
	cb(null, 'public/');
  },
  filename: function (req, file, cb) {
	const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
	cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
	return cb(null, true);
  } else {
	cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
	storage: storage,
	limits: { fileSize: MAX_SIZE },
	fileFilter: fileFilter
});
  

exports.uploadImage = upload.single('image')