# Quick Reference: Section Heights

## Current Configuration

```
┌─────────────────────────────────────────┐
│         HEADER SECTION (60vh)           │  ← Reduced from 100vh
│  [Title: 0px - no separator]            │
│                                         │
│  • Mehul Tahiliani                      │
│  • Software Developer                   │
│  • GitHub Link                          │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Title Separator: 150px] ← Reduced     │
│     WORK EXPERIENCE                     │
├─────────────────────────────────────────┤
│                                         │
│   WORK EXPERIENCE SECTION (100vh)       │
│                                         │
│   • Content...                          │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Title Separator: 150px] ← Reduced     │
│         PROJECTS                        │
├─────────────────────────────────────────┤
│                                         │
│     PROJECTS SECTION (100vh)            │
│                                         │
│   • Content...                          │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Title Separator: 150px] ← Reduced     │
│          GAMES                          │
├─────────────────────────────────────────┤
│                                         │
│      GAMES SECTION (100vh)              │
│                                         │
│   • Content...                          │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Title Separator: 120px] ← Reduced     │
│         CONTACT                         │
├─────────────────────────────────────────┤
│   CONTACT SECTION (50vh) ← Reduced      │
│                                         │
│   • Contact Info...                     │
│                                         │
└─────────────────────────────────────────┘
```

## Space Savings

**Total reduction in minimum page height:**
- Header: -40vh
- Contact: -50vh
- Title separators: -250px total (5 × 50px reduction, minus header which had none)

**Approximate savings:** ~90vh + 250px less scrolling required

## Quick Adjustment Guide

### To make a section taller:
```javascript
minHeight="120vh"  // or "150vh", "200vh", etc.
```

### To make a section shorter:
```javascript
minHeight="40vh"   // or "30vh", "25vh", etc.
```

### To adjust title spacing:
```javascript
titleHeight="100px"  // smaller spacing
titleHeight="250px"  // larger spacing
titleHeight="0px"    // no title separator (like header)
```

### To remove minimum height (auto-size to content):
```javascript
minHeight="auto"
```

## Common Patterns

**Landing/Hero Section:**
```javascript
minHeight="60vh"
titleHeight="0px"
```

**Standard Content Section:**
```javascript
minHeight="100vh"
titleHeight="150px"
```

**Footer/Contact Section:**
```javascript
minHeight="50vh"
titleHeight="120px"
```

**Gallery/Portfolio Section:**
```javascript
minHeight="80vh"
titleHeight="100px"
```

## Notes

- Values use `vh` (viewport height) units for responsiveness
- Title height uses `px` for consistent spacing
- Content areas expand beyond `minHeight` if needed
- Background simulations still fill entire viewport
