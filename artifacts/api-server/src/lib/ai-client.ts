import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("GROQ_API_KEY must be set.");
}

export const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});
