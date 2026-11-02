ALTER TABLE "costumerProfiles"
ALTER COLUMN "phoneNumber" TYPE VARCHAR(20)
USING "phoneNumber"::VARCHAR(20);