import { SQSHandler } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { putItem, updateItem } from "../../utils/dynamodb";

const s3 = new S3Client({});
const secrets = new SecretsManagerClient({});

const DESIGNS_BUCKET = process.env.DESIGNS_BUCKET!;

interface AIJobMessage {
  jobId: string;
  sessionId: string;
  userId: string;
  prompt: string;
  enhancedPrompt: string;
  artStyle: "modern" | "anime";
  mythology: string;
  imageResolution: string;
  iterationNumber: number;
}

/**
 * SQS → Lambda AI Worker
 * Processes image generation jobs from the AI queue
 * Calls OpenAI DALL-E API, uploads result to S3, saves message to DynamoDB
 */
export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const job: AIJobMessage = JSON.parse(record.body);
    console.log(`Processing AI job: ${job.jobId} for session ${job.sessionId}`);

    try {
      // 1. Get OpenAI API key from Secrets Manager
      const secretResponse = await secrets.send(
        new GetSecretValueCommand({ SecretId: "epicweave/openai-api-key" }),
      );
      const openaiApiKey = secretResponse.SecretString;

      if (!openaiApiKey) {
        throw new Error("OpenAI API key not found in Secrets Manager");
      }

      // 2. Parse resolution
      const [width, height] = job.imageResolution.split("x").map(Number);
      const size = `${width}x${height}` as
        | "1024x1024"
        | "1792x1024"
        | "1024x1792";

      // 3. Call OpenAI DALL-E 3 API
      console.log(
        `Calling DALL-E with prompt: ${job.enhancedPrompt.substring(0, 100)}...`,
      );

      const dalleResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: job.enhancedPrompt,
            n: 1,
            size,
            quality: "standard",
            response_format: "b64_json",
          }),
        },
      );

      if (!dalleResponse.ok) {
        const errorBody = await dalleResponse.text();
        console.error("DALL-E API error:", dalleResponse.status, errorBody);
        throw new Error(`DALL-E API error: ${dalleResponse.status}`);
      }

      const dalleData = (await dalleResponse.json()) as {
        data: Array<{ b64_json: string; revised_prompt?: string }>;
      };
      const imageBase64 = dalleData.data[0].b64_json;
      const revisedPrompt = dalleData.data[0].revised_prompt;

      // 4. Upload image to S3
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const s3Key = `designs/${job.sessionId}/${job.jobId}.png`;

      await s3.send(
        new PutObjectCommand({
          Bucket: DESIGNS_BUCKET,
          Key: s3Key,
          Body: imageBuffer,
          ContentType: "image/png",
          Metadata: {
            sessionId: job.sessionId,
            userId: job.userId,
            mythology: job.mythology,
            artStyle: job.artStyle,
            iterationNumber: String(job.iterationNumber),
          },
        }),
      );

      const imageUrl = `https://${DESIGNS_BUCKET}.s3.amazonaws.com/${s3Key}`;
      console.log(`Image uploaded to S3: ${s3Key}`);

      // 5. Save assistant message to DynamoDB
      const now = new Date().toISOString();
      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await putItem({
        PK: `SESSION#${job.sessionId}`,
        SK: `MSG#${now}#${messageId}`,
        sessionId: job.sessionId,
        messageId,
        role: "assistant",
        imageUrl,
        s3Key,
        revisedPrompt: revisedPrompt || job.enhancedPrompt,
        originalPrompt: job.prompt,
        mythology: job.mythology,
        artStyle: job.artStyle,
        iterationNumber: job.iterationNumber,
        jobId: job.jobId,
        status: "completed",
        createdAt: now,
      });

      // 6. Update session with latest image
      await updateItem(`USER#${job.userId}`, `SESSION#${job.sessionId}`, {
        latestImageUrl: imageUrl,
        latestJobId: job.jobId,
        latestJobStatus: "completed",
        updatedAt: now,
      });

      console.log(`Job ${job.jobId} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.jobId} failed:`, error);

      // Save failed status
      const now = new Date().toISOString();
      await updateItem(`USER#${job.userId}`, `SESSION#${job.sessionId}`, {
        latestJobId: job.jobId,
        latestJobStatus: "failed",
        latestJobError: (error as Error).message,
        updatedAt: now,
      });

      // Re-throw to let SQS retry / move to DLQ
      throw error;
    }
  }
};
