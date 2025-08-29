const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});
const {
  uploadMemory,
  deleteMemory,
  getAlbums,
  getSingleAlbum,
  deleteAlbum,
  editMemory,
  editAlbum,
  editUserProfile,
  getMemory,
} = require("../Controllers/UserController");

router.post("/upload", upload.single("image"), uploadMemory);
router.delete("/memory/:id", deleteMemory);

router.get("/albums", getAlbums);
router.get("/memories", getMemory);

router.get("/albums/:albumId", getSingleAlbum);

router.delete("/album/:id", deleteAlbum);
router.put("/memory/:id", upload.single("image"), editMemory);
router.put("/album/:id", editAlbum);

router.put("/:id", upload.single("avatar"), editUserProfile);

module.exports = router;
