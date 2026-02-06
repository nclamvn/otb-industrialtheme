# DAFC OTB Platform - Quick User Guide

## Overview

The DAFC Open-to-Buy (OTB) Platform helps you plan and manage seasonal inventory through AI-assisted budget allocation and purchase recommendations.

## Getting Started

### 1. Login
Access the platform at your organization's URL and log in with your credentials.

### 2. Dashboard
The main dashboard shows:
- Active seasons and their status
- Key performance metrics
- Recent AI suggestions
- Alerts and notifications

## Core Features

### OTB Planning

**Create a New Plan:**
1. Navigate to **Planning > OTB Plans**
2. Click **Create New Plan**
3. Select Season, Brand, and Region
4. Set your budget parameters
5. Click **Generate** for AI recommendations

**View Plan Details:**
- **Hierarchy Table**: Shows Budget, Units, AUR (Average Unit Retail), AUC (Average Unit Cost)
- **4 Key Metrics**: % Buy, % Sales, $ Sales Thru, MOC (Month of Cover)
- **Filters**: Division, Category, Collection, Sizing

### Filtering Data

| Filter | Description |
|--------|-------------|
| Division | High-level product groupings (Apparel, Footwear, Accessories) |
| Category | Product types within divisions |
| Collection | Seasonal collections (Core, Seasonal, Limited) |
| Sizing | Size type (Alpha XS-XXL, Numeric 0-16, Waist 28-42, Shoe 35-48) |

### AI Features

**AI Recommendations:**
- View AI-generated budget proposals in the suggestions panel
- Each suggestion shows a confidence score (50-95%)
- Review, accept, or modify recommendations

**Natural Language Formulas (ExcelAI):**
- Type Vietnamese commands like "tinh margin" (calculate margin)
- System converts to Excel formulas automatically
- Supported: SUM, AVERAGE, COUNT, MAX, MIN, IF, VLOOKUP

### Size Profiles

1. Go to **Size Profiles**
2. Select category and profile type
3. View size distribution percentages
4. Apply to OTB plans for accurate unit planning

### Forecasting

- Access historical data analysis
- View trend projections with 95% confidence intervals
- Compare forecast vs actual performance

## Quick Actions

| Action | Shortcut |
|--------|----------|
| Save Plan | Ctrl/Cmd + S |
| Export to Excel | Click **Export** button |
| Submit for Approval | Click **Submit** button |

## Status Workflow

```
DRAFT -> PENDING_REVIEW -> APPROVED -> ACTIVE
                       -> REJECTED (back to DRAFT)
```

## Tips

1. **Start with Budget**: Set total budget before drilling into categories
2. **Use AI Suggestions**: Review AI confidence scores - higher is better
3. **Check MOC**: Month of Cover should align with sell-through expectations
4. **Export Often**: Download Excel for offline analysis

## Support

For issues or questions:
- Contact your system administrator
- Check the in-app help tooltips
- Review notification alerts for guidance

---
*DAFC OTB Platform v1.0*
