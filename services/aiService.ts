import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentCategory } from "../types";

export async function draftAssessmentWithAI(
    artifactUrl: string,
    reflection: string,
    rubric: AssessmentCategory[]
): Promise<{ scores: Record<string, number>, feedback: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const rubricContext = rubric.map(cat => ({
        name: cat.name,
        description: cat.description,
        levels: cat.levels
    }));

    const prompt = `
You are an expert technical mentor evaluating a student's project submission.

Student's Reflection/Notes: "${reflection || 'None provided'}"
Student's Artifact URL: "${artifactUrl || 'None provided'}"

Here is the grading rubric:
${JSON.stringify(rubricContext, null, 2)}

Based on the student's reflection and the artifact provided, suggest a score (1-5) for each rubric category.
If you cannot browse the URL directly, base your assessment on the reflection, the nature of the URL (e.g., GitHub, Figma), and any context provided.

Provide a brief, constructive feedback paragraph explaining the scores.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scores: {
                        type: Type.OBJECT,
                        description: "A dictionary where keys are the exact category names from the rubric, and values are the suggested integer scores (1-5).",
                        additionalProperties: { type: Type.INTEGER }
                    },
                    feedback: {
                        type: Type.STRING,
                        description: "A brief overall feedback explaining the scores and providing constructive advice."
                    }
                },
                required: ["scores", "feedback"]
            }
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }

    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanText);
        return result;
    } catch (e) {
        throw new Error("Failed to parse AI response");
    }
}
