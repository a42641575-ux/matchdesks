-- Fix: jobs that were prematurely expired (status EXPIRED but their 30-day
-- window from postedAt hasn't actually elapsed). The daily cron flips any
-- ACTIVE job with expiresAt < now to EXPIRED; some imported/seeded jobs had
-- expiresAt set incorrectly (before postedAt + 30 days), causing them to
-- expire days early. This resets them to ACTIVE and corrects expiresAt to
-- postedAt + 30 days, so the posting policy ("30 days from posting") holds.
--
-- Only touches EXPIRED jobs whose postedAt is less than 30 days ago — leaves
-- genuinely-old expired jobs alone.
UPDATE "Job"
SET status = 'ACTIVE',
    "expiresAt" = ("postedAt" + INTERVAL '30 days')
WHERE status = 'EXPIRED'
  AND "postedAt" > (NOW() - INTERVAL '30 days');
