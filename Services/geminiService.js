import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const generateEmbedding = async (text) => {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values; // Float32Array
};
// ✅ Generate summary
export const generateSummary = async (title, content) => {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });
  const prompt = `Summarize the following document titled "${title}" in 3-5 concise sentences:\n\n${content}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ✅ Generate intelligent tags
export const generateTags = async (content) => {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });
  const prompt = `
Generate 5-7 concise tags for the following document content. 
Return ONLY the tags, separated by commas, with no numbering, explanations, or extra text.

Content:
${content}
`;
  const result = await model.generateContent(prompt);
  const tagsText = result.response.text();
  return tagsText
    .split(/[,;\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

// ✅ Q&A with context
export const askGemini = async (question, documents) => {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

  // Build context from docs
  const context = documents
    .map(
      (doc, i) =>
        `Document ${i + 1}:\nTitle: ${doc.title}\nContent: ${doc.content}`
    )
    .join("\n\n");

  const prompt = `Answer the following question using ONLY the provided documents. 
If the documents don't contain the answer, say "I couldn’t find relevant information."

Question: ${question}

Documents:
${context}`;

  try {
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer, // ✅ only the answer
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      answer: "Sorry, I couldn’t generate an answer at the moment.",
    };
  }
};
