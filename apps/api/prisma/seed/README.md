# Database Seeding

Import real data from Excel files into the DAFC OTB Platform database.

## Quick Start

```bash
# Seed all data
pnpm seed

# Seed specific type
pnpm seed:master        # Seasons, Divisions, Brands, Categories, Locations
pnpm seed:size          # Size Profiles
pnpm seed:planning      # Budget Allocations
pnpm seed:performance   # Store Performance

# Utilities
pnpm seed:list          # List available Excel files
pnpm seed:validate      # Validate an Excel file
pnpm seed:reset         # Reset seeded data (requires --confirm)
```

## Excel File Structure

Place Excel files in `prisma/seed/data/`:

```
data/
├── master/
│   ├── seasons.xlsx          # Season definitions
│   ├── divisions.xlsx        # Division/Department data
│   ├── brands.xlsx           # Brand data (requires divisions)
│   ├── categories.xlsx       # Product categories
│   ├── locations.xlsx        # Store locations
│   └── size-definitions.xlsx # Size codes (XS, S, M, L, XL, XXL)
├── sku/
│   └── size-profiles.xlsx    # Size distribution by category
├── planning/
│   └── budgets.xlsx          # Budget allocations
└── performance/
    └── store-sales.xlsx      # Historical store performance
```

## Excel File Formats

### master/seasons.xlsx
| season_code | season_name | season_group | year | start_date | end_date | is_active | is_current |
|-------------|-------------|--------------|------|------------|----------|-----------|------------|
| SS26 | Spring/Summer 2026 | SS | 2026 | 2026-01-01 | 2026-06-30 | TRUE | TRUE |
| FW25 | Fall/Winter 2025 | FW | 2025 | 2025-07-01 | 2025-12-31 | TRUE | FALSE |

### master/divisions.xlsx
| division_code | division_name | description | is_active | sort_order |
|---------------|---------------|-------------|-----------|------------|
| LUXURY | Luxury Brands | High-end fashion | TRUE | 1 |
| PREMIUM | Premium Brands | Premium casual | TRUE | 2 |

### master/brands.xlsx
| brand_code | brand_name | division_code | description | logo_url | is_active | sort_order |
|------------|------------|---------------|-------------|----------|-----------|------------|
| BURBERRY | Burberry | LUXURY | British luxury | | TRUE | 1 |
| COACH | Coach | PREMIUM | Accessible luxury | | TRUE | 2 |

### master/categories.xlsx
| category_code | category_name | description | is_active | sort_order |
|---------------|---------------|-------------|-----------|------------|
| WOMENS | Women's | Women's apparel | TRUE | 1 |
| MENS | Men's | Men's apparel | TRUE | 2 |
| ACCESSORIES | Accessories | Bags, shoes, etc | TRUE | 3 |

### master/locations.xlsx
| location_code | location_name | type | store_group | address | is_active | sort_order |
|---------------|---------------|------|-------------|---------|-----------|------------|
| 18142 | DAFC Flagship | STORE | DAFC | District 1, HCMC | TRUE | 1 |
| 18649 | REX Plaza | STORE | REX | District 1, HCMC | TRUE | 2 |
| 18686 | TTP Store | STORE | TTP | District 3, HCMC | TRUE | 3 |

### master/size-definitions.xlsx
| size_code | size_name | size_order | size_type | numeric_equivalent | is_active |
|-----------|-----------|------------|-----------|-------------------|-----------|
| XS | Extra Small | 1 | ALPHA | | TRUE |
| S | Small | 2 | ALPHA | | TRUE |
| M | Medium | 3 | ALPHA | | TRUE |
| L | Large | 4 | ALPHA | | TRUE |
| XL | Extra Large | 5 | ALPHA | | TRUE |
| XXL | Double XL | 6 | ALPHA | | TRUE |

### sku/size-profiles.xlsx
| category_code | profile_type | based_on_units | xs | s | m | l | xl | xxl |
|---------------|--------------|----------------|-----|---|----|----|----|-----|
| WOMENS | HISTORICAL | 1000 | 10 | 20 | 30 | 25 | 10 | 5 |
| MENS | HISTORICAL | 1000 | 5 | 15 | 30 | 30 | 15 | 5 |

### planning/budgets.xlsx
| season_code | brand_code | location_code | total_budget | seasonal_budget | replenishment_budget | currency | status |
|-------------|------------|---------------|--------------|-----------------|---------------------|----------|--------|
| SS26 | BURBERRY | 18142 | 5000000 | 4000000 | 1000000 | USD | DRAFT |

### performance/store-sales.xlsx
| location_code | season_code | period_start | period_end | sales_quantity | sales_value | stock_quantity | stock_value |
|---------------|-------------|--------------|------------|----------------|-------------|----------------|-------------|
| 18142 | FW25 | 2025-07-01 | 2025-07-31 | 150 | 2500000000 | 200 | 3000000000 |

## Seed Order

Dependencies are handled automatically:

1. **Master Data** (required first)
   - Seasons
   - Divisions
   - Brands (depends on Divisions)
   - Categories
   - Locations
   - Size Definitions

2. **Size Profiles** (depends on Categories, Size Definitions)

3. **Planning Data** (depends on Seasons, Brands, Locations)
   - Budget Allocations

4. **Performance Data** (depends on Seasons, Locations)
   - Store Performance

## Validation

Data is validated before insertion:
- Required fields checked
- Data types validated
- Foreign key references verified
- Business rules applied (e.g., percentages sum to 100%)

Invalid rows are skipped with error logging.

## Calculated Fields

Some fields are auto-calculated:
- **Sell-through rate**: `sales_quantity / (sales_quantity + stock_quantity) * 100`
- **Weeks of cover**: `stock_quantity / (sales_quantity / 4)`
- **Margin**: Estimated from sales and stock values
