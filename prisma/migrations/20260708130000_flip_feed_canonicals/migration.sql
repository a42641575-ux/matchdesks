-- Flip all FEED-sourced jobs to canonical-to-MatchDesks.
-- Previously feed jobs set canonicalUrl = feedSourceUrl (pointing at the
-- original site), which passed all Google ranking equity to the source.
-- Setting it to NULL makes the job page canonical to MatchDesks so it
-- earns Google for Jobs equity on our domain.
UPDATE "Job"
SET "canonicalUrl" = NULL
WHERE source = 'FEED' AND "canonicalUrl" IS NOT NULL;
