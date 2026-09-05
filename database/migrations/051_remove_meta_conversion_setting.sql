-- Remove unused Meta Conversion API setting
-- Meta conversion is no longer used in this project.

DELETE FROM settings
WHERE key = 'meta_conversion_api_access_token';
