-- career_url can be absent
ALTER TABLE companies
ALTER COLUMN career_url DROP NOT NULL;

-- at least one identity must exist
ALTER TABLE companies
ADD CONSTRAINT companies_identity_check
CHECK (
  career_url IS NOT NULL
  OR ats_url IS NOT NULL
);

-- career URL unique when present
CREATE UNIQUE INDEX companies_career_url_unique
ON companies (career_url)
WHERE career_url IS NOT NULL;