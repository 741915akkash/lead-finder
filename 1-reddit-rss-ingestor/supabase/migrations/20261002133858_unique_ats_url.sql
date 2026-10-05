CREATE UNIQUE INDEX companies_ats_url_unique
ON companies (ats_url)
WHERE ats_url IS NOT NULL;