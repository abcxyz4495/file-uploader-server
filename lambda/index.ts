import { neon } from "@neondatabase/serverless";
import { v2 } from "cloudinary";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { v4 } from "uuid";

import { image } from "../lib/db/schema";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

app.post("/api/wh/image/:whsecret", async (c) => {
  const whsecret = c.req.param("whsecret");
  const data = await c.req.json();
  if (
    !data.url ||
    data.asset_folder === "" ||
    !data.asset_folder.includes("/")
  ) {
    return c.json({ message: "Invalid request." }, 400);
  }

  const userId = data.asset_folder.split("/")[1];
  if (!userId) {
    return c.json({ message: "Invalid request." }, 400);
  }

  if (process.env.WH_SECRET !== whsecret) {
    return c.json({ message: "Invalid secret." }, 400);
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    await db.insert(image).values({
      id: v4(),
      url: data.url,
      meta: JSON.stringify(data),
      userId,
    });

    return c.json({ message: "Image saved" }, 200);
  } catch (error: unknown) {
    return c.json({ message: "Error saving image" }, 500);
  }
});

app.get("/api/get-signed-url/:userId", async (c) => {
  const userId = c.req.param("userId");

  if (!userId) {
    return c.json({ message: "User ID is required." }, 400);
  }

  const timestamp = Math.round(new Date().getTime() / 1000) - 59 * 60;
  const signature = v2.utils.api_sign_request(
    {
      timestamp,
      folder: `file-uploader/${userId}`,
    },
    process.env.CLOUDINARY_API_SECRET!
  );
  return c.json({
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY!,
    folder: `file-uploader/${userId}`,
  });
});

export const handler = handle(app);
