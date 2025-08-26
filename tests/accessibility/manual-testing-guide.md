# Manual Accessibility Testing Guide - ScentMatch

## Overview
This guide provides step-by-step instructions for manually testing accessibility features to ensure WCAG 2.1 AA compliance.

## Pre-Testing Setup

### Required Tools
1. **Screen Readers**
   - Windows: NVDA (free) or JAWS
   - macOS: VoiceOver (built-in)
   - Linux: Orca

2. **Browser Extensions**
   - axe DevTools (Chrome/Firefox)
   - WAVE Web Accessibility Evaluator
   - Lighthouse (built into Chrome DevTools)

3. **System Settings**
   - High contrast mode
   - Reduced motion settings
   - Zoom capabilities (up to 200%)

## Testing Checklist

### 1. Keyboard Navigation Testing

#### Skip Links Test
1. **Test Steps:**
   - Load homepage (/)
   - Press Tab key once
   - Verify skip link appears and is focused
   - Press Enter to activate
   - Verify focus moves to main content

2. **Expected Results:**
   - ✅ Skip link is visually hidden until focused
   - ✅ Skip link has visible focus indicator
   - ✅ Skip link successfully moves focus to main content
   - ✅ Skip link disappears after use

#### Tab Order Test
1. **Test Steps:**
   - Load homepage (/)
   - Press Tab repeatedly through all interactive elements
   - Verify logical tab order: skip links → main nav → content → bottom nav

2. **Expected Results:**
   - ✅ Tab order follows visual layout
   - ✅ No keyboard traps (unless intentional, like modals)
   - ✅ All interactive elements are reachable
   - ✅ Disabled elements are skipped

#### Navigation Test
1. **Test Steps:**
   - Use Tab to reach bottom navigation
   - Use arrow keys within navigation (if supported)
   - Press Enter or Space to activate nav items
   - Test Escape key on any overlays/modals

2. **Expected Results:**
   - ✅ All navigation items are keyboard accessible
   - ✅ Enter and Space keys activate buttons/links
   - ✅ Arrow keys provide alternative navigation where appropriate
   - ✅ Escape closes overlays and returns focus appropriately

### 2. Screen Reader Testing

#### VoiceOver Testing (macOS)
1. **Setup:**
   - Enable VoiceOver: Cmd+F5
   - Use VoiceOver Utility to adjust settings if needed

2. **Test Steps:**
   - Navigate to ScentMatch homepage
   - Use VO+Right Arrow to navigate through page elements
   - Test landmark navigation: VO+U, then use arrow keys
   - Test form interactions and announcements

3. **Expected Results:**
   - ✅ Page title is announced correctly
   - ✅ Landmarks (main, nav, etc.) are properly identified
   - ✅ Headings create proper page structure (VO+U → Headings)
   - ✅ Form labels are announced with inputs
   - ✅ Dynamic content changes are announced
   - ✅ Button purposes are clear from announcements

#### NVDA Testing (Windows)
1. **Setup:**
   - Download and install NVDA (free)
   - Start NVDA before opening browser

2. **Test Steps:**
   - Navigate to ScentMatch homepage
   - Use H key to navigate headings
   - Use F key to navigate form fields
   - Use B key to navigate buttons
   - Use K key to navigate links

3. **Expected Results:**
   - ✅ Headings follow logical hierarchy (h1, h2, h3...)
   - ✅ Forms are properly labeled and grouped
   - ✅ Buttons have descriptive names
   - ✅ Links have meaningful text
   - ✅ Page regions are properly identified

### 3. Visual Testing

#### High Contrast Mode Test
1. **Test Steps:**
   - **Windows:** Settings → Ease of Access → High Contrast → Turn on
   - **macOS:** System Preferences → Accessibility → Display → Increase Contrast
   - **Browser:** Force high contrast via DevTools

2. **Expected Results:**
   - ✅ All text remains readable
   - ✅ Interactive elements remain visible
   - ✅ Focus indicators are clearly visible
   - ✅ Important information isn't conveyed by color alone

#### Zoom/Magnification Test
1. **Test Steps:**
   - Use browser zoom up to 200%
   - Test at 150% and 200% zoom levels
   - Verify all functionality remains accessible

2. **Expected Results:**
   - ✅ No horizontal scrolling at 200% zoom
   - ✅ All interactive elements remain accessible
   - ✅ Text doesn't overlap or become cut off
   - ✅ Touch targets remain at least 44x44px

#### Color Contrast Test
1. **Test Steps:**
   - Use browser DevTools or WAVE extension
   - Check contrast ratios for:
     - Normal text (4.5:1 minimum)
     - Large text (3:1 minimum)
     - UI components (3:1 minimum)

2. **Expected Results:**
   - ✅ All text meets contrast requirements
   - ✅ Interactive elements are distinguishable
   - ✅ Focus indicators have sufficient contrast

### 4. Mobile/Touch Testing

#### Touch Target Test
1. **Test Steps:**
   - Open site on mobile device or use browser DevTools mobile simulation
   - Test all interactive elements with finger/stylus
   - Verify spacing between touch targets

2. **Expected Results:**
   - ✅ All touch targets are at least 44x44px
   - ✅ Touch targets have adequate spacing (8px minimum)
   - ✅ Touch feedback is provided (visual/haptic)
   - ✅ No accidental activations

#### Mobile Screen Reader Test
1. **Test Steps:**
   - **iOS:** Enable VoiceOver in Settings → Accessibility
   - **Android:** Enable TalkBack in Settings → Accessibility
   - Navigate through the mobile site

2. **Expected Results:**
   - ✅ All content is accessible via gestures
   - ✅ Touch exploration works correctly
   - ✅ Reading order is logical on mobile layout

### 5. Form Accessibility Testing

#### Form Label Test
1. **Test Steps:**
   - Navigate to search page or any forms
   - Use screen reader to navigate form fields
   - Test error states and validation

2. **Expected Results:**
   - ✅ All form fields have associated labels
   - ✅ Required fields are clearly marked
   - ✅ Error messages are descriptive and actionable
   - ✅ Form submission results are announced

### 6. Dynamic Content Testing

#### ARIA Live Regions Test
1. **Test Steps:**
   - Perform actions that trigger dynamic content changes
   - Navigate between pages
   - Trigger any loading states or status updates

2. **Expected Results:**
   - ✅ Loading states are announced
   - ✅ Page navigation is announced
   - ✅ Success/error messages are announced
   - ✅ Dynamic content updates don't interrupt user flow

## Test Results Documentation

### Test Report Template

```markdown
# Accessibility Test Report - [Date]

## Test Environment
- **Browser:** [Browser version]
- **Screen Reader:** [Name/version if used]
- **Operating System:** [OS version]
- **Device:** [Desktop/Mobile/Tablet]

## Test Results Summary
- **Pass:** X tests
- **Fail:** X tests
- **Skip:** X tests (with reason)

## Critical Issues Found
1. **Issue:** [Description]
   - **WCAG Criterion:** [e.g., 2.1.1 - Keyboard]
   - **Severity:** [Critical/High/Medium/Low]
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]

## Recommendations
- [Priority fixes]
- [Enhancement suggestions]

## Sign-off
Tested by: [Name]
Date: [Date]
```

### Common Issues to Watch For

#### Critical Issues
- Keyboard traps that prevent navigation
- Missing or incorrect labels on form elements
- Insufficient color contrast (below 4.5:1 for normal text)
- Missing focus indicators
- Inaccessible skip links

#### High Priority Issues
- Incorrect heading hierarchy
- Missing ARIA labels for complex widgets
- Form validation errors not announced
- Dynamic content changes not announced
- Touch targets smaller than 44px

#### Medium Priority Issues
- Non-descriptive link text ("click here")
- Images missing alt text
- Redundant or verbose screen reader announcements
- Inconsistent navigation patterns

## Automated vs Manual Testing

### What Automated Tests Cover
- Color contrast ratios
- Missing alt text
- Form labels
- Heading hierarchy
- ARIA usage

### What Requires Manual Testing
- Keyboard navigation flow
- Screen reader usability
- Focus management
- Context and meaning of content
- User experience with assistive technologies

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [axe DevTools Documentation](https://www.deque.com/axe/devtools/)

### Training
- [Web Accessibility by Google (Udacity)](https://www.udacity.com/course/web-accessibility--ud891)
- [WebAIM Screen Reader Articles](https://webaim.org/articles/)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Note:** This manual testing should be performed regularly, especially:
- Before major releases
- After significant UI changes
- When new interactive components are added
- Following user feedback about accessibility issues