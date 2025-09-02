const UserModel = require("../Models/UserModel");
const DocumentModel = require("../Models/DocumentModel");
const { askGemini, generateEmbedding } = require("../Services/geminiService");

const search = async (req, res) => {
  const { query, mode = "text" } = req.body; // "text" | "semantic"
  const { userId } = req.query;

  try {
    if (!query || !userId) {
      return res.status(400).json({ error: "Query and userId required" });
    }

    // 1. Find user and their teams
    const user = await UserModel.findById(userId).populate("teams");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const teamIds = user.teams.map((t) => t._id);

    let results = [];

    if (mode === "text") {
      // ✅ Full-text search using Atlas Search
      results = await DocumentModel.aggregate([
        {
          $search: {
            text: {
              query,
              path: ["title", "content", "tags"], // search across multiple fields
              fuzzy: { maxEdits: 1 }, // typo tolerance
            },
          },
        },
        { $match: { team: { $in: teamIds } } }, // only user's teams

        { $limit: 10 },
        {
          $project: {
            title: 1,
            content: 1,
            summary: 1,
            tags: 1,
            team: 1,
            createdBy: 1,
            createdByRole: 1,
            updatedBy: 1,
            versions: 1,
            createdAt: 1,
            updatedAt: 1,
            score: { $meta: "searchScore" },
          },
        },
      ]);
    } else {
      // ✅ Semantic search using vector embeddings
      const queryVector = await generateEmbedding(query);

      results = await DocumentModel.aggregate([
        {
          $search: {
            knnBeta: {
              vector: queryVector,
              path: "embedding",
              k: 5, // return top 5
            },
          },
        },
        { $match: { team: { $in: teamIds } } }, // restrict to teams

        { $limit: 5 },
        {
          $project: {
            title: 1,
            content: 1,
            summary: 1,
            tags: 1,
            team: 1,

            createdBy: 1,
            createdByRole: 1,
            updatedBy: 1,
            versions: 1,
            createdAt: 1,
            updatedAt: 1,
            score: { $meta: "searchScore" }, // similarity score
          },
        },
        {
          $match: { score: { $gte: 0.7 } }, // keep only relevant ones
        },
      ]);
    }

    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

const ask = async (req, res) => {
  const { question } = req.body;
  const { userId } = req.query;

  try {
    if (!question || !userId) {
      return res.status(400).json({ error: "Query and userId required" });
    }

    // 1. Find user and their teams
    const user = await UserModel.findById(userId).populate("teams");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const teamIds = user.teams.map((t) => t._id);

    const docs = await DocumentModel.find({
      team: { $in: teamIds },
    });

    if (!docs.length) {
      return res.json({ results: [] });
    }

    const result = await askGemini(question, docs);

    res.json({ result });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Semantic search failed" });
  }
};

module.exports = { search, ask };
