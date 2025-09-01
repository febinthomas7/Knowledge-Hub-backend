const UserModel = require("../Models/UserModel");
const TeamModel = require("../Models/TeamModel");
const DocumentModel = require("../Models/DocumentModel");
const {
  generateSummary,
  generateTags,
  generateEmbedding,
} = require("../Services/geminiService");
const getAiSumary = async (req, res) => {
  const { title, content } = req.body;
  const summary = await generateSummary(title, content);

  try {
    res.status(201).json({
      message: " successfully created AI summary",
      summary,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAiTags = async (req, res) => {
  const { content } = req.body;
  const tags = await generateTags(content);

  try {
    res.status(201).json({
      message: " successfully created AI tags",
      tags,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { team, userId } = req.query;

    if (!team || !title || !content) {
      return res
        .status(400)
        .json({ message: "Team, title, and content are required" });
    }

    const teamDoc = await TeamModel.findById(team).populate("members.user");
    if (!teamDoc) {
      return res.status(404).json({ message: "Team not found" });
    }

    const member = teamDoc.members.find(
      (m) => m.user._id.toString() === userId
    );
    if (!member) {
      return res
        .status(403)
        .json({ message: "User is not a member of this team" });
    }

    const role = member.role;

    // ✅ Auto-generate summary & tags using Gemini
    const summary = await generateSummary(title, content);
    const tags = await generateTags(content);
    const embedding = await generateEmbedding(content);

    const newDocument = new DocumentModel({
      team,
      title,
      content,
      summary,
      embedding,
      tags,
      createdBy: userId,
      createdByRole: role,
      updatedBy: userId,
      versions: [
        {
          content,
          editedBy: userId,
        },
      ],
    });

    await newDocument.save();

    await TeamModel.findByIdAndUpdate(team, {
      $push: { documents: newDocument._id },
    });

    res.status(201).json({
      message: "Document created successfully with AI summary & tags",
      document: newDocument,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const editDocument = async (req, res) => {
  try {
    const { title, content, summary, tags } = req.body;
    const { id } = req.params;
    const { userId } = req.query;

    // 1. Get document
    const document = await DocumentModel.findById(id).populate("team");
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // 2. Find user role in this team
    const team = await TeamModel.findById(document.team).populate(
      "members.user"
    );
    const member = team.members.find(
      (m) => m.user._id.toString() === userId.toString()
    );

    if (!member) {
      return res.status(403).json({ message: "You are not part of this team" });
    }

    // 3. Permission check
    const isAdmin = member.role === "admin";
    const isOwner = document.createdBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "You don't have permission to edit this document" });
    }

    // 4. Update fields
    let hasChanges = false;

    // Track if any field is updated
    if (title && title !== document.title) {
      document.title = title;
      hasChanges = true;
    }

    if (summary && summary !== document.summary) {
      document.summary = summary;
      hasChanges = true;
    }

    if (tags && JSON.stringify(tags) !== JSON.stringify(document.tags)) {
      document.tags = tags;
      hasChanges = true;
    }

    if (content && content !== document.content) {
      document.content = content;
      hasChanges = true;
    }

    // If anything changed, push version (only content is stored in versions)
    if (hasChanges) {
      document.versions.push({
        title: document.title, // always current content
        editedBy: userId,
        editedAt: new Date(),
      });
    }

    document.updatedBy = userId;

    const updatedDoc = await document.save();

    res.json({
      message: "Document updated successfully",
      document: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { docId, userId } = req.query;
    console.log(docId, userId);
    const doc = await DocumentModel.findById(docId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Allow delete if admin OR creator of doc
    // if (doc.createdBy.toString() !== userId && !req.user.isAdmin) {
    //   return res.status(403).json({ message: "Not authorized to delete this document" });
    // }

    await TeamModel.findByIdAndUpdate(doc.team, {
      $pull: { documents: docId },
    });

    // Delete the document itself
    await DocumentModel.findByIdAndDelete(docId);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, userId } = req.body;

    // creator becomes admin
    const newTeam = new TeamModel({
      name,
      members: [{ user: userId, role: "admin" }],
    });

    await newTeam.save();

    await UserModel.findByIdAndUpdate(userId, {
      $push: { teams: newTeam._id },
    });
    res.status(201).json(newTeam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating team", error: err.message });
  }
};

const myTeams = async (req, res) => {
  const { userId } = req.query;

  try {
    // Find user and populate their teams
    const user = await UserModel.findById(userId)
      .populate({
        path: "teams",
        populate: [
          {
            path: "members.user",
            select: "name email avatar",
          },
          {
            path: "documents", // 👈 populate docs inside team
            select:
              "title createdByRole content summary versions tags createdAt createdBy updatedBy",
            populate: [
              { path: "createdBy", select: "name email" },
              { path: "updatedBy", select: "name email" },
              { path: "versions.editedBy", select: "name email" }, // 👈 populate version editors
            ],
          },
        ],
      })
      .select("teams");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const teamsWithRole = user.teams.map((team) => {
      const member = team.members.find((m) => m.user._id.toString() === userId);
      return {
        ...team.toObject(),
        role: member?.role || "user",
      };
    });

    res.json(teamsWithRole);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching teams", error: err.message });
  }
};

const getSingleDocument = async (req, res) => {
  const { docId } = req.query;
  try {
    const document = await DocumentModel.findById(docId)
      .populate("createdBy", "name email avatar")
      .populate("updatedBy", "name email avatar")
      .populate("versions.editedBy", "name email avatar");

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    console.log(email, teamId);
    // find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // find team
    const team = await TeamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // check if already a member
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User already in team" });
    }

    // add user to team
    team.members.push({ user: user._id, role: "user" });
    await team.save();

    if (!user.teams.includes(team._id)) {
      user.teams.push(team._id);
      await user.save();
    }

    res.status(200).json({ message: "User invited successfully", team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserActivityFeed = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Convert to ObjectId

    // Example: find the user and their teams
    const user = await UserModel.findById(userId).populate("teams");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const teamIds = user.teams.map((team) => team._id);

    const activities = await DocumentModel.find({ team: { $in: teamIds } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("team", "name")
      .populate("updatedBy", "name email");

    res.json(activities);
  } catch (err) {
    console.error("Error in getFeed:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove a member from a team
const removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { userId } = req.query;

    // Find the team
    const team = await TeamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if requesting user is an admin
    const requestingUser = team.members.find(
      (m) => m.user.toString() === userId
    );
    if (!requestingUser || requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    // Prevent removing another admin
    const targetMember = team.members.find(
      (m) => m.user.toString() === memberId
    );
    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in team" });
    }
    if (targetMember.role === "admin") {
      return res.status(403).json({ message: "Cannot remove another admin" });
    }

    // Remove the member
    team.members = team.members.filter((m) => m.user.toString() !== memberId);

    await team.save();
    await UserModel.findByIdAndUpdate(memberId, {
      $pull: { teams: teamId },
    });

    res.json({ message: "Member removed successfully", team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTeam,
  myTeams,
  createDocument,
  editDocument,
  deleteDocument,
  getSingleDocument,
  inviteUser,
  getUserActivityFeed,
  removeMember,
  getAiSumary,
  getAiTags,
};
