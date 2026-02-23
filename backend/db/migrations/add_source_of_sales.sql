-- Add source_of_sales column to sales table
ALTER TABLE sales ADD COLUMN source_of_sales VARCHAR(20);

-- Add comment to describe the column
COMMENT ON COLUMN sales.source_of_sales IS 'Source of the sale: AGENT or WALK-IN';
