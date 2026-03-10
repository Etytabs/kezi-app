# Kezi Mobile App - Design Guidelines

## Design Philosophy: "Gentle Glassmorphism"
Kezi enforces a strict design system optimized for emotional safety and privacy in women's health tracking. The visual language prioritizes organic shapes, soft depth, and dynamic theming that responds to biological cycles.

## Visual Identity

### Typography
- **Font Family**: Inter (Google Fonts) with system-ui fallback
- **Logotype**: 24px, Bold (700), -0.025em tracking, Pink→Purple gradient
- **Hero Greeting**: 30px, Bold (700), -0.025em tracking
- **Section Headers**: 10px, Bold (700), 0.05em tracking (uppercase)
- **Card Titles**: 24px, Bold (700)
- **Body Text**: 14px, Medium (500) main / 12px, Regular (400) secondary
- **Display Numbers**: 48px, Bold (700) for cycle day display
- **Chip Labels**: 10px, Bold (700), 0.025em tracking

### Color System

#### Brand Gradients
- **Primary**: Pink-500 (#EC4899) → Purple-600 (#9333EA)
- **Cycle-Synced Backgrounds** (Dynamic):
  - Menstrual: Pink/Rose gradients (#FDF2F8 base)
  - Follicular: Teal/Emerald gradients (#F0FDFA base)
  - Ovulation: Purple/Indigo gradients (#FAF5FF base)
  - Luteal: Pink→Purple→Teal blend

#### Functional Colors
- **Menstrual**: #EC4899 (Light) / #F472B6 (Dark)
- **Fertile/Follicular**: #0D9488 (Light) / #2DD4BF (Dark)
- **Ovulation**: #9333EA (Light) / #A855F7 (Dark)
- **Warning**: #F59E0B (Light) / #FBBF24 (Dark)
- **Success**: #10B981 (Light) / #34D399 (Dark)
- **Danger**: #EF4444 (Light) / #F87171 (Dark)

#### Night Mode ("Deep Lavender")
- **Base Background**: #1A1025
- **Surface Cards**: #2E2035
- **Active States**: #3D2B4C
- **Primary Text**: #E9D5FF

### Glassmorphism Materials

#### Light Glass
- Background: `rgba(255, 255, 255, 0.6)`
- Blur: `backdrop-filter: blur(24px)`
- Border: `1px solid rgba(255, 255, 255, 0.5)`
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.05)`

#### Dark Glass
- Background: `rgba(46, 32, 53, 0.6)`
- Blur: `backdrop-filter: blur(24px)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`

## Geometry & Structure

### Squircle Corners (NO sharp edges)
- **Standard Cards**: 24px border radius
- **Small Elements**: 16px border radius
- **Buttons/Inputs**: 12px border radius
- **Pills/Chips**: Full rounded (9999px)

### The Cycle Wheel
- **Dimensions**: 180px × 180px
- **Track**: 8px stroke, gray-100 color
- **Progress Arc**: 8px stroke, Pink-400 → Purple-500 gradient, rounded linecaps
- **Knob**: 20px diameter (8.5px radius + 3px stroke), white fill, purple stroke, shadow-md
- **Ovulation Marker**: Hollow dot (4px radius, 2px stroke) at Day 14 position

### Calendar Widget
- **Grid**: 7 columns
- **Day Cells**: 40px × 40px circles
- **Phase Layer**: Absolute positioned with 6px padding, 50% opacity
- **Selected State**: 110% scale, high contrast background

### Iconography
- **Source**: Lucide React icons
- **Stroke Width**: 2px standard / 2.5px active
- **Corner Style**: Rounded caps and joins
- **Navigation Icons**: 24px, inactive gray-400, active purple-600
- **Active Icon Container**: Purple-50 background (light) / #3D2B4C (dark), -8px vertical shift

## Component Specifications

### Sticky Header
- **Height**: ~60px (fluid)
- **Material**: 95% white opacity (light) / 95% lavender-950 (dark)
- **Blur**: Medium backdrop blur

### Cards & Containers
- **Daily Insight**: Dynamic phase gradient background, 16px corners, shadow-lg
- **Product List Item**: 16px padding, staggered fade-in animation (75ms delay per item)
- **Hover State**: 2px lift (-translate-y-0.5), scale-[1.01]

### Action Zone (Bottom UI)
- **Surface**: 90% white/lavender opacity with backdrop blur
- **Border**: 1px solid top border (gray-100 light / white/10 dark)
- **Z-Index**: 50 (floats above content)
- **Padding**: Safe area aware

### Inputs & Forms
- **Height**: 52px (16px vertical padding)
- **Background**: Gray-50 light / Night-deep dark
- **Focus Ring**: Pink-300

### Map Markers
- **Shape**: Custom "Glass Drop" SVG pin
- **Fill**: Pink (#EC4899) or Teal (#0D9488) by merchant type
- **Stroke**: White, 2px width
- **Hover**: Scale 1.5 → 2.0

## Animations & Interactions

### Standard Animations
- **Fade In**: Opacity 0→1, 0.5s ease-out
- **Slide Up**: TranslateY 20px→0 + opacity 0→1, 0.4s
- **Pulse Slow**: Opacity 1→0.5→1, 3s (splash icon)

### Interaction States
- **Card Hover**: scale-[1.01] + shadow-md (micro-lift)
- **Button Press**: active:scale-95 (tactile feedback)
- **Tab Navigation**: Active tab scales up with -8px vertical translation

## Authentication & Onboarding

### Splash Screen
- **Background**: Pink-50 → Purple-100 diagonal gradient
- **Logo**: 1.5× scale with 3s pulse animation
- **Duration**: Minimum 2.5s for brand perception

### Auth Modal
- **Backdrop**: Black 40% opacity with slight blur
- **Card**: Top corners 24px rounded only
- **Focus Ring**: Pink-300 on inputs

## Screen-Specific Guidelines

### Dashboard
- **Greeting**: 30px bold with dynamic cycle gradient
- **Cycle Journey Card**: Glass material, 24px corners, phase-appropriate icon container (48px)
- **Status Pills**: Full rounded, bold 10px text, cycle-synced colors

### Marketplace
- **View Toggle**: Map/List switcher in sticky header
- **Cycle Sync**: Auto-highlight products matching current phase
- **Stock Indicators**: Success (in stock) / Warning (low) / Danger (out)

### Profile
- **Avatars**: 56px circles
- **Active State**: 2px pink/purple border + shadow-lg glow
- **Layout**: Horizontal scroll with snap points
- **Settings Cards**: 24px corners, 10px uppercase headers with gray-50 background strip

### Admin Panel
- **User List Items**: 72px height
- **Role Badges**: Admin (pink-500, white text, shadow-lg) / User (gray-100, gray-500 text)
- **Hover**: Subtle white/40 or white/5 background

## Accessibility & Safety
- All touchable areas minimum 44px × 44px
- High contrast ratios maintained in night mode
- Focus states clearly visible on all interactive elements
- Privacy-first: Deep Lavender night mode reduces eye strain vs. pure black
- Confirmation dialogs for destructive actions (role changes, account deletion)