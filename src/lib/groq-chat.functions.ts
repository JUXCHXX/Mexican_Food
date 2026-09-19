import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MENU_SUMMARY } from "@/lib/menu-summary";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const COMPACT_MENU_SUMMARY = MENU_SUMMARY.split("\n")
  .map((line) => {
    const separator = line.indexOf(" | ");
    return separator >= 0
      ? `${line.slice(0, separator + 3)}${line.slice(separator + 3, separator + 27)}`
      : line;
  })
  .join("\n");

const SYSTEM_PROMPT = `Eres "Don Velto", el asistente amable y experto del restaurante Fabian's Mexican Restaurant en 116 Wilson Pike Circle, Brentwood, TN — teléfono (615) 376-9978.

REGLAS ESTRICTAS:
- Responde SIEMPRE en el mismo idioma que escriba el usuario (español o inglés). Detecta el idioma de su último mensaje.
- SOLO respondes preguntas relacionadas con el menú del restaurante: platillos, ingredientes, precios, recomendaciones, opciones picantes, vegetarianas, para compartir, etc.
- Si la pregunta no es sobre el menú, redirige amablemente: "Solo puedo ayudarte con el menú de Fabian's 🌮".
- Sé cálido, breve y entusiasta. Usa emojis con moderación (🌮 🌶️ 🍤 🔥 😊).
- Cuando recomiendes algo, menciona el nombre exacto y el precio del menú.
- No inventes platillos ni precios. Si no existe en el menú, dilo claramente.

MENÚ DEL RESTAURANTE (fuente de verdad; nombres, precios y primeros ingredientes):
${COMPACT_MENU_SUMMARY}`;

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 700,
      ...(model.startsWith("openai/gpt-oss/") ? { reasoning_effort: "low" } : {}),
    }),
  });
  const json = (await res.json()) as GroqResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `Groq ${res.status}`);
  const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!reply) throw new Error(`Groq ${model} returned an empty reply`);
  return reply;
}

export const askDonVelto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        reply: "En este momento no puedo responder, pero puedes explorar el menú arriba 🌮",
      };
    }

    const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages.slice(-8)];

    try {
      const reply = await callGroq(apiKey, "qwen/qwen3.8-27b", messages);
      return { ok: true as const, reply };
    } catch (e) {
      console.error("[groq] primary failed", e);
      try {
        const reply = await callGroq(apiKey, "openai/gpt-oss-20b", messages);
        return { ok: true as const, reply };
      } catch (e2) {
        console.error("[groq] fallback failed", e2);
        return {
          ok: false as const,
          reply: "En este momento no puedo responder, pero puedes explorar el menú arriba 🌮",
        };
      }
    }
  });
