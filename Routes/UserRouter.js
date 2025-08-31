const router = require("express").Router();

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
} = require("../Controllers/UserController");

router.post("/create-team", createTeam);
router.get("/my-teams", myTeams);
router.post("/team/:teamId/invite", inviteUser);
router.post("/search", search);
router.post("/ask", ask);
router.post("/get-tags", getAiTags);
router.post("/get-summary", getAiSumary);

router.get("/feed", getUserActivityFeed);
router.get("/document", getSingleDocument);
router.post("/document", createDocument);
router.put("/document/:id", editDocument);
router.delete("/document", deleteDocument);
router.delete("/team/:teamId/member/:memberId", removeMember);

module.exports = router;
