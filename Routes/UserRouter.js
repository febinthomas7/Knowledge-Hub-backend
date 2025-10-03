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
const ensureAuthentication = require("../Middlewares/Auth");

router.post("/create-team", ensureAuthentication, createTeam);
router.get("/my-teams", ensureAuthentication, myTeams);
router.post("/team/:teamId/invite", ensureAuthentication, inviteUser);
router.post("/search", ensureAuthentication, search);
router.post("/ask", ensureAuthentication, ask);
router.post("/get-tags", ensureAuthentication, getAiTags);
router.post("/get-summary", ensureAuthentication, getAiSumary);
router.post("/doc-upload", upload.single("file"), ensureAuthentication, Upload);

router.get("/feed", ensureAuthentication, getUserActivityFeed);
router.get("/get-token/:fileId", ensureAuthentication, getToken);
router.get("/docs", ensureAuthentication, getUserDocs);
router.get("/gridfs/:fileId", ensureAuthentication, getFiles);
router.post("/save/:fileId", ensureAuthentication, saveFile);
router.delete("/delete/:fileId", deleteDocFile);

router.get("/document", ensureAuthentication, getSingleDocument);
router.post("/document", ensureAuthentication, createDocument);
router.put("/document/:id", ensureAuthentication, editDocument);
router.delete("/document", ensureAuthentication, deleteDocument);
router.delete(
  "/team/:teamId/member/:memberId",
  ensureAuthentication,
  removeMember
);

module.exports = router;
