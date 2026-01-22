# STAR SAAS Portal - UI Style Documentation

## Overview
This document captures the current UI style, design patterns, color scheme, and component structure of the STAR SAAS Demo Portal based on exploration of all major pages.

## Layout Structure

### Main Layout
- **Fixed Left Sidebar**: Dark grey background (#2c3e50 or similar) with navigation menu
- **Top Header Bar**: Light grey background with merchant selector, logo, and user/settings icons
- **Main Content Area**: White background with card-based widgets and data tables

### Navigation Structure
- **Sidebar Navigation**: 
  - Search bar at top (dark grey background)
  - Menu items with icons and right-pointing arrows for expandable sections
  - Active menu items highlighted in light blue
  - Sub-menu items indented below parent items
  - Scrollable sidebar for long menu lists

## Color Scheme

### Primary Colors
- **Dark Grey**: Sidebar background, inactive text, headers for "Yesterday's Overview"
- **Light Grey**: Top header bar, input field backgrounds
- **White**: Main content area, card backgrounds, table backgrounds
- **Light Blue (#4A90E2 or similar)**: 
  - Active menu items
  - Primary buttons
  - Key metrics (sales figures)
  - "Today's Overview" card header
  - Chart elements (donut charts, bar charts)
  - Links and interactive elements

### Accent Colors
- **Green**: Used in bar charts for "Amount" data
- **Darker Blue**: Used in donut charts for "Total Settled Fund"
- **Red**: Error messages, alerts

## Typography

### Font Family
- Sans-serif font throughout (likely Arial, Helvetica, or similar)
- Clean, modern, readable

### Font Sizes & Weights
- **Large Bold**: Key metrics (sales figures, totals) - typically 24-32px
- **Medium**: Headers, card titles, table headers
- **Regular**: Body text, labels, table content
- **Small**: Secondary information, timestamps, legends

## Components

### Cards/Widgets
- **White background** with subtle borders
- **Rounded corners** (slight, ~2-4px)
- **Card headers**: 
  - Light blue for active/primary cards ("Today's Overview")
  - Dark grey for secondary cards ("Yesterday's Overview")
- **Padding**: Generous padding inside cards (16-24px)
- **Shadow**: Subtle shadow or border for depth

### Buttons
- **Primary buttons**: Light blue background, white text
- **Secondary buttons**: Grey background or outlined style
- **Icon buttons**: Icons with text labels
- **Hover states**: Slight color change or elevation

### Input Fields
- **Text inputs**: 
  - Light grey or white background
  - Dark grey text
  - Border: subtle grey border
  - Padding: 8-12px
- **Checkboxes**: Standard checkbox style with labels
- **Date pickers**: Similar to text inputs

### Tables
- **Header row**: Light grey background, dark grey text
- **Data rows**: White background, alternating row colors (subtle)
- **Sortable columns**: Downward-pointing triangle icons
- **Borders**: Subtle borders between rows and columns
- **Scrollable**: Vertical scrollbar when content exceeds viewport

### Charts
- **Donut Charts**: 
  - Light blue and darker blue segments
  - Center displays total amount in large bold text
  - Legend below with colored dots and labels
- **Bar Charts**: 
  - Green for "Amount" data
  - Blue for "Count" data
  - Dual Y-axes when needed
  - Clear axis labels and legends

### Navigation Elements
- **Menu items**: 
  - Icons on the left (simple line-art style)
  - Text in the middle
  - Right arrow for expandable items
  - Active state: Light blue background highlight
- **Breadcrumbs**: "Section > Subsection" format, typically at top of content area

### Action Buttons/Links
- **Text links with icons**: 
  - "Clear Filter", "Mark As Trust", "Refund Apply", etc.
  - Icon on left, text on right
  - Blue color for links
  - Horizontal row layout

## Page-Specific Patterns

### Dashboard Page
- **Overview Cards**: Two prominent cards side-by-side showing today's and yesterday's metrics
- **Account Summary**: Large donut chart with total amount
- **Transaction Currency Chart**: Bar chart with dual Y-axes
- **Customize Button**: Small button with wrench icon below overview cards
- **Multiple widget sections**: Card Type Analysis, Conversion Ratio, etc.

### Transaction Detail Page
- **Filter Section**: 
  - Date range inputs
  - Configuration checkboxes
  - Search button
- **Action Bar**: Row of action links (Clear Filter, Mark As Trust, Refund Apply, etc.)
- **Data Table**: Large table with sortable columns
- **Breadcrumbs**: "Transactions > Transaction Detail"

### Form Pages
- **Form fields**: Label above input field
- **Search/Submit buttons**: Blue primary buttons
- **Checkbox groups**: Horizontal layout for related options

## UI Patterns & Conventions

### Spacing
- **Card padding**: 16-24px
- **Section spacing**: 16-32px between sections
- **Element spacing**: 8-16px between related elements

### Icons
- **Style**: Simple, line-art icons
- **Size**: Consistent sizing (typically 16-20px)
- **Usage**: Navigation, actions, data types

### Loading States
- **Loading spinner**: Animated circle with dots
- **"Loading" text**: Displayed below spinner
- **Full page loading**: Centered in content area

### Interactive States
- **Hover**: Subtle color change or background highlight
- **Active**: Light blue background for menu items
- **Focus**: Outline or border highlight for form inputs

## Design Principles

1. **Clean & Minimal**: Uncluttered interface with plenty of white space
2. **Data-Driven**: Emphasis on clear data presentation and visualization
3. **Functional**: Icons and labels clearly indicate functionality
4. **Consistent**: Same patterns used across all pages
5. **Professional**: Business-appropriate color scheme and typography
6. **Accessible**: Clear contrast, readable fonts, logical structure

## Key Pages Explored

1. **Dashboard** (`/portal/admin/mainPage/moduleId_10.html`)
   - Overview cards, charts, account summary

2. **Transaction Detail** (`/portal/backwaybill/waybillPage/moduleId_1110.html`)
   - Filter section, action buttons, data table

3. **Login Page** (`/portal/login.jsp`)
   - Centered card layout, simple form

4. **Navigation Structure**:
   - Dashboard
   - Transactions (with sub-menus)
   - Disputes (with sub-menus)
   - Chargeback Alert (with sub-menus)
   - Risk Management (with sub-menus)
   - Financial (with sub-menus)
   - Reports (with sub-menus)
   - Merchants (with sub-menus)
   - Acquirers
   - System (with sub-menus)

## Notes for New Feature Design

When designing a new page/feature, follow these patterns:

1. **Use the same layout structure**: Fixed sidebar + header + main content
2. **Maintain color consistency**: Use the established color palette
3. **Follow card-based design**: Group related content in white cards
4. **Use consistent typography**: Match font sizes and weights
5. **Include breadcrumbs**: Show navigation path at top of content
6. **Add appropriate icons**: Use same icon style for consistency
7. **Maintain spacing**: Follow established padding and margin patterns
8. **Use same button styles**: Primary buttons in light blue
9. **Follow table patterns**: If using tables, match existing table styling
10. **Include loading states**: Use spinner for async operations

## Chinese Localization

The portal supports Chinese (Simplified) localization. All menu items, labels, and UI text are translated. See `portal_chinese_terminology.md` for a comprehensive reference of Chinese terminology used throughout the portal.

### Key Chinese Terms
- **首页** (shǒu yè) - Dashboard/Homepage
- **交易查询** (jiāo yì chá xún) - Transaction Query
- **交易记录** (jiāo yì jì lù) - Transaction Record
- **纠纷管理** (jiū fēn guǎn lǐ) - Dispute Management
- **风险控制** (fēng xiǎn kòng zhì) - Risk Control
- **资金管理** (zī jīn guǎn lǐ) - Fund Management
- **报表分析** (bào biǎo fēn xī) - Report Analysis
- **商户** (shāng hù) - Merchant
- **搜索** (sōu suǒ) - Search
- **查询** (chá xún) - Query

---

*Documentation created based on exploration of STAR SAAS Demo Portal (English and Chinese versions)*
*Date: 2026-01-14*
