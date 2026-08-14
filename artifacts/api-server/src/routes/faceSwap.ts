import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TOKEN = process.env.REPLICATE_API_TOKEN;
const API_BASE = "https://api.replicate.com/v1";

// cdingram/face-swap — verified working model
// swap_image = source face (user selfie), input_image = target photo
const MODEL_VERSION = "d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111";

type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

interface Prediction {
  id: string;
  status: PredictionStatus;
  output?: string | string[];
  error?: string;
}

class ReplicateError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: "INSUFFICIENT_CREDIT" | "UPSTREAM_AUTH" | "UPSTREAM_ERROR",
  ) {
    super(message);
  }
}

async function createPrediction(sourceImage: string, targetImage: string): Promise<string> {
  const res = await fetch(`${API_BASE}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=10",
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        swap_image: sourceImage,   // user's face
        input_image: targetImage,  // target scene/person
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 402) {
      throw new ReplicateError(
        "The AI service needs billing enabled before it can create a face swap.",
        402,
        "INSUFFICIENT_CREDIT",
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new ReplicateError(
        "The AI service is not authorized. Check the server configuration.",
        502,
        "UPSTREAM_AUTH",
      );
    }
    throw new ReplicateError(
      `The AI service could not start this swap (${res.status}).`,
      502,
      "UPSTREAM_ERROR",
    );
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

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new ReplicateError(
          "The AI service is not authorized. Check the server configuration.",
          502,
          "UPSTREAM_AUTH",
        );
      }
      continue;
    }

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

  if (typeof sourceImage !== "string" || typeof targetImage !== "string") {
    res.status(400).json({
      error: "Choose both a face photo and a target photo before starting.",
      code: "MISSING_IMAGES",
    });
    return;
  }

  if (!TOKEN) {
    res.status(500).json({
      error: "The AI service is not configured yet.",
      code: "MISSING_CONFIGURATION",
    });
    return;
  }

  try {
    const resultUrl = await createPrediction(sourceImage, targetImage);
    res.json({ resultUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Face swap failed";
    req.log.error({ err }, "face-swap error");
    if (err instanceof ReplicateError) {
      res.status(err.statusCode).json({ error: message, code: err.code });
      return;
    }
    res.status(500).json({
      error: "The face swap could not be completed. Please try again.",
      code: "FACE_SWAP_FAILED",
    });
  }
});

export default router;
