import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "yan-ops/face-swap";
const API_BASE = "https://api.replicate.com/v1";

type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

interface Prediction {
  id: string;
  status: PredictionStatus;
  output?: string | string[];
  error?: string;
}

async function createPrediction(sourceImage: string, targetImage: string): Promise<string> {
  const res = await fetch(`${API_BASE}/models/${MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=5",
    },
    body: JSON.stringify({
      input: {
        source_image: sourceImage,
        target_image: targetImage,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Replicate submit failed (${res.status}): ${body}`);
  }

  const prediction = await res.json() as Prediction;

  if (prediction.status === "succeeded" && prediction.output) {
    return normalizeOutput(prediction.output);
  }

  return poll(prediction.id);
}

async function poll(id: string): Promise<string> {
  for (let attempt = 0; attempt < 90; attempt++) {
    await sleep(2000);

    const res = await fetch(`${API_BASE}/predictions/${id}`, {
      headers: { Authorization: `Token ${TOKEN}` },
    });

    if (!res.ok) continue;

    const prediction = await res.json() as Prediction;

    if (prediction.status === "succeeded" && prediction.output) {
      return normalizeOutput(prediction.output);
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error ?? "unknown error"}`);
    }
  }

  throw new Error("Prediction timed out after 3 minutes");
}

function normalizeOutput(output: string | string[]): string {
  return Array.isArray(output) ? output[0] : output;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

router.post("/face-swap", async (req, res) => {
  const { sourceImage, targetImage } = req.body as {
    sourceImage?: string;
    targetImage?: string;
  };

  if (!sourceImage || !targetImage) {
    res.status(400).json({ error: "sourceImage and targetImage are required" });
    return;
  }

  if (!TOKEN) {
    res.status(500).json({ error: "REPLICATE_API_TOKEN is not configured" });
    return;
  }

  try {
    const resultUrl = await createPrediction(sourceImage, targetImage);
    res.json({ resultUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Face swap failed";
    req.log.error({ err }, "face-swap error");
    res.status(500).json({ error: message });
  }
});

export default router;
