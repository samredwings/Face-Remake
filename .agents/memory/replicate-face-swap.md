---
  name: Replicate face swap model
  description: Verified working Replicate model for face swap with correct endpoint, version, and field names
  ---

  # Replicate Face Swap

  **Model:** cdingram/face-swap  
  **Version:** d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111  
  **Endpoint:** POST https://api.replicate.com/v1/predictions (with `version` in body)

  **Why not /v1/models/{owner}/{model}/predictions:** Community models require the versioned endpoint, not the model-name shorthand. Model-name endpoint returns 404 for community models.

  **Input fields:**
  - `swap_image` — the face to insert (user's selfie)
  - `input_image` — the target scene/person

  **Common pitfalls:**
  - Express body limit must be ≥ 25 MB for two base64-encoded photos
  - Requires funded Replicate account (~$0.002/run); free credits exhaust quickly
  