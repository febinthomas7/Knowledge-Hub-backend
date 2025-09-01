const UserModel = require("../Models/UserModel");
const TeamModel = require("../Models/TeamModel");
const DocumentModel = require("../Models/DocumentModel");
const { askGemini, generateEmbedding } = require("../Services/geminiService");

const search = async (req, res) => {
  const { query, mode = "text" } = req.body; // mode can be "semantic" or "text"
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

    let docs = [];

    if (mode === "text") {
      // ✅ Regular text filter
      docs = await DocumentModel.find({
        team: { $in: teamIds },
        $or: [
          { title: new RegExp(query, "i") },
          { content: new RegExp(query, "i") },
          { tags: { $in: [query] } },
        ],
      })
        .populate("createdBy", "name email role")
        .populate("updatedBy", "name email role")
        .populate("versions.editedBy", "name email role");
    } else {
      // ✅ Semantic search with threshold
      const queryVector = await generateEmbedding(query);

      const allDocs = await DocumentModel.find({ team: { $in: teamIds } })
        .populate("createdBy", "name email role")
        .populate("updatedBy", "name email role")
        .populate("versions.editedBy", "name email role");

      const scoredDocs = allDocs
        .map((doc) => {
          if (!doc.embedding || doc.embedding.length === 0) return null;

          const score = cosineSimilarity(queryVector, doc.embedding);
          return { doc, score };
        })
        .filter(Boolean);

      if (!scoredDocs.length) {
        return res.json({ results: [] });
      }

      // Sort by highest similarity
      scoredDocs.sort((a, b) => b.score - a.score);

      const bestMatch = scoredDocs[0];

      // ✅ Apply threshold (e.g., 0.7)
      const SIMILARITY_THRESHOLD = 0.5;

      if (bestMatch.score < SIMILARITY_THRESHOLD) {
        return res.json({ results: [] }); // no good match
      }

      res.json({ results: [bestMatch.doc] });
    }

    // Normalize output
    const results = docs.map((doc) => ({
      _id: doc._id,
      team: doc.team,
      title: doc.title,
      content: doc.content,
      summary: doc.summary,
      tags: doc.tags,
      createdBy: doc.createdBy,
      createdByRole: doc.createdByRole,
      updatedBy: doc.updatedBy,
      versions: doc.versions,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      __v: doc.__v,
    }));

    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

// Utility: cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

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

    // 3. Run semantic search
    const result = await askGemini(question, docs);

    res.json({ result });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Semantic search failed" });
  }
};

module.exports = { search, ask };
