import { prisma } from "@initmyfolio/db";
import { aggregateGitHubData } from "../lib/github.js";

const SYNC_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 5000; // 5s between batches to avoid rate limits

async function syncUser(username: string): Promise<void> {
  try {
    const githubData = await aggregateGitHubData(username);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const githubDataJson = JSON.parse(JSON.stringify(githubData)) as any;

    await prisma.user.update({
      where: { username },
      data: {
        githubData: githubDataJson,
        displayName: githubData.profile.name ?? username,
        bio: githubData.profile.bio,
        avatarUrl: githubData.profile.avatar_url,
        location: githubData.profile.location,
        website: githubData.profile.blog,
        lastSyncedAt: new Date(),
      },
    });
    console.log(`[Cron] Synced ${username}`);
  } catch (err) {
    console.error(`[Cron] Failed to sync ${username}:`, err);
  }
}

async function runSyncJob(): Promise<void> {
  console.log("[Cron] Starting sync job...");

  const eightHoursAgo = new Date(Date.now() - SYNC_INTERVAL_MS);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: eightHoursAgo } },
      ],
    },
    select: { username: true },
    orderBy: { lastSyncedAt: "asc" },
    take: 500,
  });

  console.log(`[Cron] Syncing ${users.length} users...`);

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((u) => syncUser(u.username)));

    if (i + BATCH_SIZE < users.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log("[Cron] Sync job complete.");
}

export function startCronJobs(): void {
  runSyncJob().catch(console.error);
  setInterval(() => {
    runSyncJob().catch(console.error);
  }, SYNC_INTERVAL_MS);
}
