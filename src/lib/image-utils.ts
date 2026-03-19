import fs from "fs";
import path from "path";
import { getCardFilename } from "./cards";
import type { CardId } from "./types";

export function getCardImageBase64(cardId: CardId): string {
  const filename = getCardFilename(cardId);
  const filePath = path.join(process.cwd(), "public", "cards", filename);
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

export function buildImageContent(cardIds: CardId[]) {
  const content: ({ type: "text"; text: string } | { type: "image"; image: string })[] = [];
  for (let i = 0; i < cardIds.length; i++) {
    content.push({ type: "text", text: `Card ${i}:` });
    content.push({
      type: "image",
      image: getCardImageBase64(cardIds[i]),
    });
  }
  return content;
}
