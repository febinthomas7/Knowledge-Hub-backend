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

    results = await searchDocuments({ query, teamIds, mode });

    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

async function searchDocuments({ query, teamIds, mode }) {
  console.log("Search mode:", mode);
  const basePipeline = [
    { $match: { team: { $in: teamIds } } },

    // Populate updatedBy
    {
      $lookup: {
        from: "users",
        localField: "updatedBy",
        foreignField: "_id",
        as: "updatedBy",
      },
    },
    { $unwind: { path: "$updatedBy", preserveNullAndEmptyArrays: true } },

    // Unwind versions to populate editedBy
    { $unwind: { path: "$versions", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "versions.editedBy",
        foreignField: "_id",
        as: "versions.editedBy",
      },
    },
    {
      $unwind: { path: "$versions.editedBy", preserveNullAndEmptyArrays: true },
    },

    // Group back to array
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        content: { $first: "$content" },
        summary: { $first: "$summary" },
        tags: { $first: "$tags" },
        team: { $first: "$team" },
        createdBy: { $first: "$createdBy" },
        updatedBy: { $first: "$updatedBy" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        score: { $first: { $ifNull: ["$score", 0] } }, // ✅ safe fallback
        permissions: { $first: "$permissions" },
        versions: { $push: "$versions" },
      },
    },

    { $limit: 10 },
  ];

  if (mode === "text") {
    // Add Atlas Search text stage at the beginning
    console.log("Text search mode");
    basePipeline.unshift({
      $search: {
        text: {
          query,
          path: ["title", "content", "tags"],
          fuzzy: { maxEdits: 1 },
        },
      },
    });

    // Add score metadata in project
    basePipeline.push({
      $project: {
        title: 1,
        content: 1,
        summary: 1,
        tags: 1,
        team: 1,
        createdBy: 1,
        updatedBy: 1,
        versions: 1,
        createdAt: 1,
        permissions: 1,
        updatedAt: 1,
        score: { $meta: "searchScore" },
      },
    });
  } else if (mode === "semantic") {
    console.log("Vector search mode");
    // Generate embedding outside this function
    const queryVector = await generateEmbedding(query);

    basePipeline.unshift({
      $vectorSearch: {
        index: "vector",
        path: "embedding",
        queryVector,
        k: 10,
        numCandidates: 100,
        similarity: "cosine",
        limit: 5,
      },
    });

    // Project for vector search
    basePipeline.push(
      {
        $project: {
          title: 1,
          content: 1,
          summary: 1,
          tags: 1,
          team: 1,
          createdBy: 1,
          updatedBy: 1,
          versions: 1,
          createdAt: 1,
          updatedAt: 1,
          permissions: 1,
          score: { $meta: "vectorSearchScore" },
        },
      }
      // {
      //   $match: { score: { $lt: 0 } }, // filter out irrelevant results
      // }
    );
  }

  return await DocumentModel.aggregate(basePipeline);
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

    const result = await askGemini(question, docs);

    res.json({ result });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Semantic search failed" });
  }
};

module.exports = { search, ask };
