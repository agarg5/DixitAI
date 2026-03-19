import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const DIXIT_STYLE_PREFIX = `Create a Dixit board game card illustration. The art style must be: surreal and dreamlike, painterly with soft watercolor-like textures, rich vibrant colors with magical lighting, fantasy and fairy-tale inspired, deeply symbolic and metaphorical, mysterious with hidden details to discover. The image should be a single cohesive scene with no text, borders, or frames. Subject: `;

export async function POST(req: Request) {
  const { prompt, mode } = await req.json();

  try {
    let imagePrompt: string;

    if (mode === "random" || !prompt?.trim()) {
      // Generate a creative random prompt using GPT-4o
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `You are a creative director for the board game Dixit, known for its surreal, dreamlike card art. Generate a single vivid, imaginative scene description for a new Dixit card. Be poetic and surreal — combine unexpected elements. Examples of good themes: "a clock melting into a river of stars", "a child riding a paper boat through a forest of giant mushrooms", "a lighthouse whose beam is made of butterflies". Return ONLY the scene description, nothing else. Keep it under 30 words.`,
        temperature: 1.2,
      });
      imagePrompt = DIXIT_STYLE_PREFIX + text;
    } else {
      imagePrompt = DIXIT_STYLE_PREFIX + prompt.trim();
    }

    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: imagePrompt,
      size: "1024x1024",
    });

    return Response.json({
      imageUrl: `data:image/png;base64,${image.base64}`,
      prompt: imagePrompt.replace(DIXIT_STYLE_PREFIX, ""),
    });
  } catch (err) {
    console.error("Image generation failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
