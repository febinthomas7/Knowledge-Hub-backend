const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const { search, ask } = require("../Controllers/GeminiController");
const {
  createTeam,
  myTeams,
  createDocument,
  editDocument,
  deleteDocument,
  getSingleDocument,
  inviteUser,
  getUserActivityFeed,
  removeMember,
  getAiTags,
  getAiSumary,
  getToken,
  Upload,
  getUserDocs,
  getFiles,
  saveFile,
  deleteDocFile,
} = require("../Controllers/UserController");

router.post("/create-team", createTeam);
router.get("/my-teams", myTeams);
router.post("/team/:teamId/invite", inviteUser);
router.post("/search", search);
router.post("/ask", ask);
router.post("/get-tags", getAiTags);
router.post("/get-summary", getAiSumary);
router.post("/doc-upload", upload.single("file"), Upload);

router.get("/feed", getUserActivityFeed);
router.get("/get-token/:fileId", getToken);
router.get("/docs", getUserDocs);
router.get("/gridfs/:fileId", getFiles);
router.post("/save/:fileId", saveFile);
router.delete("/delete/:fileId", deleteDocFile);

router.get("/document", getSingleDocument);
router.post("/document", createDocument);
router.put("/document/:id", editDocument);
router.delete("/document", deleteDocument);
router.delete("/team/:teamId/member/:memberId", removeMember);

module.exports = router;
