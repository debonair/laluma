# LUMA Design System & Product Decisions

This document codifies the design language and architectural decisions for the LUMA community platform. It serves as the "Source of Truth" for maintaining visual and functional consistency.

## 1. Visual Language & Branding
- **Typography Pairing**:
    - **Display (Headers)**: `Syne`. Bold, geometric, and distinctively premium.
    - **Body (Reading)**: `Space Grotesk`. High personality with excellent legibility at small sizes.
- **Color Palette (LUMA Sage & Cream)**:
    - `Primary`: #52796f (Sage Forest - Calm & Accessible)
    - `Accent`: #84a59d (Muted Mint)
    - `Secondary`: #cad2c5 (Sage Tint - Used for Message Bubbles)
    - `Surface`: #F8FAFC (Pearl/Off-white)
    - `Text (High Contrast)`: #1b3022 (Dark Moss)

## 2. Layout & Spacing Philosophy
- **"Reading App" Real Estate**: Minimized header/footer heights and padding to maximize the screen area for content consumption.
- **Micro-Spacings**: Standardized on `0.75rem` (12px) for card internal spacing and `1rem` (16px) for layout sections.
- **Reading Containers**: Centered content limited to an `800px` max-width for optimal line-length and eye-tracking.

## 3. Component Architecture
- **Unified Header**:logo-centric branding with integrated identity (User Avatar) and high-priority utilities (Alerts, Messages).
- **Navigation Split**: 
    - **Bottom Bar**: High-level context switches (Home, Social, Explore, Profile).
    - **Header Utilities**: Action-based and status-based items.
- **Content Cards**: Every card must use `box-shadow: var(--shadow-sm)` and `border: 1px solid var(--border-color)` to maintain a "library collection" look.

## 4. Product Decisions
- **Sign Out**: Placed exclusively in **Profile Settings** to reduce visual clutter on discovery pages.
- **Action Strip Pattern**: For "My Luma" and personal dashboards, prefer horizontal action rows (`action-pill`) over heavy grid systems.
- **Drafts First**: Encourage creation by including "Drafts" as a primary quick action for creators.

## 5. Maintenance Guidelines
- Avoid inline styles. Use global classes defined in `index.css`.
- Reference `--primary-color`, `--shadow-soft`, and `--text-secondary` for all relative styling.
- Ensure the **Back Button** is always available on sub-pages (controlled via `Header` component).
