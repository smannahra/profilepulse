import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";

const USER_ID = 1;

// Map of possible LinkedIn CSV column names → our internal key
const COLUMN_MAP: Record<string, string> = {
  // Content / body
  sharecommentary: "content",
  "share commentary": "content",
  content: "content",
  text: "content",
  message: "content",
  body: "content",

  // Date
  date: "postedAt",
  "share date": "postedAt",
  "post date": "postedAt",
  timestamp: "postedAt",
  created: "postedAt",

  // Likes
  numlikes: "likeCount",
  "num likes": "likeCount",
  likes: "likeCount",
  "like count": "likeCount",
  likecount: "likeCount",

  // Comments
  numcomments: "commentCount",
  "num comments": "commentCount",
  comments: "commentCount",
  "comment count": "commentCount",
  commentcount: "commentCount",

  // LinkedIn post URL / ID
  sharelink: "linkedinPostId",
  "share link": "linkedinPostId",
  url: "linkedinPostId",
  link: "linkedinPostId",
  posturl: "linkedinPostId",
  "post url": "linkedinPostId",
};

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[_\-]/g, " ").trim();
}

function detectColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeKey(header);
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      mapping[header] = mapped;
    }
  }
  return mapping;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV file" },
        { status: 400 }
      );
    }

    const headers = parsed.meta.fields ?? [];
    const columnMap = detectColumns(headers);

    if (!columnMap[headers.find((h) => columnMap[h] === "content") ?? ""]) {
      return NextResponse.json(
        {
          error:
            "Could not find a content/post column. Ensure your LinkedIn export CSV has a 'ShareCommentary' or 'Content' column.",
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const row of parsed.data) {
      // Build a normalised post object from the row
      const post: {
        content?: string;
        postedAt?: Date;
        likeCount?: number;
        commentCount?: number;
        linkedinPostId?: string;
      } = {};

      for (const [header, field] of Object.entries(columnMap)) {
        const raw = (row[header] ?? "").trim();
        if (!raw) continue;

        switch (field) {
          case "content":
            post.content = raw;
            break;
          case "postedAt": {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) post.postedAt = d;
            break;
          }
          case "likeCount": {
            const n = parseInt(raw, 10);
            if (!isNaN(n)) post.likeCount = n;
            break;
          }
          case "commentCount": {
            const n = parseInt(raw, 10);
            if (!isNaN(n)) post.commentCount = n;
            break;
          }
          case "linkedinPostId":
            post.linkedinPostId = raw;
            break;
        }
      }

      if (!post.content) {
        skipped++;
        continue;
      }

      // Deduplicate by linkedinPostId (if present) or by content+date
      if (post.linkedinPostId) {
        const existing = await prisma.post.findUnique({
          where: { linkedinPostId: post.linkedinPostId },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      await prisma.post.create({
        data: {
          userId: USER_ID,
          content: post.content,
          postedAt: post.postedAt ?? new Date(),
          likeCount: post.likeCount ?? 0,
          commentCount: post.commentCount ?? 0,
          linkedinPostId: post.linkedinPostId ?? null,
          source: "IMPORT",
          synced: true,
        },
      });

      imported++;
    }

    // Log the import
    await prisma.activityLog.create({
      data: {
        userId: USER_ID,
        action: "CSV_IMPORT",
        metadata: JSON.stringify({ imported, skipped, filename: file.name }),
      },
    });

    return NextResponse.json({ imported, skipped, total: parsed.data.length });
  } catch (error) {
    console.error("[POST /api/import]", error);
    return NextResponse.json(
      { error: "Import failed. Please check your CSV file and try again." },
      { status: 500 }
    );
  }
}
