# Accessibility Testing Procedures

## Overview

This document provides comprehensive accessibility testing procedures to ensure ongoing WCAG 2.1 AA compliance for the ScentMatch platform. These procedures cover both automated and manual testing approaches for all mobile-first UX components.

## Testing Standards

### WCAG 2.1 AA Compliance Requirements

**Level A Requirements** (Must Meet):
- Images have alternative text
- Videos have captions
- Color is not the only means of conveying information
- Keyboard navigation is available for all functionality
- Page has a proper heading structure

**Level AA Requirements** (Must Meet):
- Color contrast ratio is at least 4.5:1 for normal text
- Color contrast ratio is at least 3:1 for large text
- Text can be resized up to 200% without assistive technology
- Focus indicators are clearly visible
- Touch targets are at least 44px in size

## Automated Testing Setup

### axe-core Integration

**Installation and Configuration:**

```bash
npm install --save-dev @axe-core/react @testing-library/jest-axe
```

**Base Test Configuration:**

```javascript
// tests/utils/accessibility-setup.js
import { configureAxe, toHaveNoViolations } from 'jest-axe';

// Configure axe-core for our specific needs
const axe = configureAxe({
  rules: {
    // Enable WCAG 2.1 AA rules
    'wcag21aa': { enabled: true },
    'wcag21a': { enabled: true },
    
    // Enable mobile-specific rules
    'target-size': { enabled: true },
    'touch-target-size': { enabled: true },
    
    // Custom rules for our components
    'bottom-nav-accessibility': { enabled: true },
    'filter-chips-accessibility': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
});

expect.extend(toHaveNoViolations);

export default axe;
```

### Automated Test Suite

**Component-Level Testing:**

```javascript
// tests/accessibility/bottom-nav-a11y.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import axe from '../utils/accessibility-setup';
import { BottomNav } from '@/components/navigation/bottom-nav';

describe('BottomNav Accessibility', () => {
  test('should not have any accessibility violations', async () => {
    const { container } = render(<BottomNav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should have proper ARIA attributes', () => {
    const { getByRole } = render(<BottomNav />);
    const nav = getByRole('navigation');
    
    expect(nav).toHaveAttribute('aria-label', 'Bottom navigation');
  });

  test('should have accessible touch targets', () => {
    const { getAllByRole } = render(<BottomNav />);
    const buttons = getAllByRole('button');
    
    buttons.forEach(button => {
      const styles = getComputedStyle(button);
      const height = parseInt(styles.minHeight);
      const width = parseInt(styles.minWidth);
      
      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    });
  });
});
```

**Filter Chips Testing:**

```javascript
// tests/accessibility/filter-chips-a11y.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import axe from '../utils/accessibility-setup';
import { FilterChips } from '@/components/search/filter-chips';
import { mockFilterData } from '../mocks/filter-data';

describe('FilterChips Accessibility', () => {
  test('should not have any accessibility violations', async () => {
    const { container } = render(
      <FilterChips
        initialFilters={mockFilterData}
        onFilterChange={jest.fn()}
        onCountUpdate={jest.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('should announce filter changes to screen readers', async () => {
    const { getByTestId, getByRole } = render(
      <FilterChips
        initialFilters={mockFilterData}
        onFilterChange={jest.fn()}
        onCountUpdate={jest.fn()}
      />
    );
    
    const filterButton = getByTestId('filter-chip-notes-fresh');
    const announcements = getByRole('status');
    
    fireEvent.click(filterButton);
    
    expect(announcements).toHaveTextContent('Fresh filter applied');
  });

  test('should support keyboard navigation', () => {
    const { getAllByRole } = render(
      <FilterChips
        initialFilters={mockFilterData}
        onFilterChange={jest.fn()}
        onCountUpdate={jest.fn()}
      />
    );
    
    const buttons = getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabindex', '0');
      
      // Test Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(button).toHaveAttribute('aria-pressed');
      
      // Test Space key
      fireEvent.keyDown(button, { key: ' ' });
      expect(button).toHaveAttribute('aria-pressed');
    });
  });
});
```

### Continuous Integration Testing

**GitHub Actions Configuration:**

```yaml
# .github/workflows/accessibility-testing.yml
name: Accessibility Testing

on:
  pull_request:
    paths:
      - 'components/**'
      - 'app/**'
      - 'tests/**'

jobs:
  accessibility:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run accessibility tests
        run: npm run test:accessibility
      
      - name: Run axe-core CLI
        run: npx @axe-core/cli https://localhost:3000 --save accessibility-report.json
      
      - name: Upload accessibility report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: accessibility-report.json
```

## Manual Testing Procedures

### Screen Reader Testing

**Required Screen Readers:**

- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **iOS**: VoiceOver (built-in)
- **Android**: TalkBack (built-in)

**Testing Procedure:**

1. **Navigate the Application**
   - Use only screen reader navigation
   - Test all interactive elements
   - Verify all content is announced correctly
   - Check reading order is logical

2. **Test Bottom Navigation**
   ```
   Expected Behavior:
   - Each tab is announced with role and state
   - Active tab is identified as "current page"
   - Icons are hidden from screen reader (aria-hidden="true")
   - Labels are clear and descriptive
   ```

3. **Test Filter Chips**
   ```
   Expected Behavior:
   - Filter state changes are announced
   - Count updates are communicated
   - AI suggestions are properly labeled
   - Removal buttons are clearly identified
   ```

4. **Test Forms and Inputs**
   ```
   Expected Behavior:
   - All form fields have labels
   - Error messages are associated with fields
   - Required fields are identified
   - Instructions are provided where needed
   ```

**Screen Reader Testing Checklist:**

```markdown
## Screen Reader Testing Checklist

### Navigation Testing
- [ ] Can navigate to all interactive elements
- [ ] Tab order is logical and intuitive
- [ ] Skip links work correctly
- [ ] Landmark regions are properly identified

### Content Testing
- [ ] Headings create logical document structure
- [ ] Lists are properly structured
- [ ] Tables have proper headers
- [ ] Images have meaningful alt text

### Interactive Elements
- [ ] Buttons have descriptive labels
- [ ] Links have meaningful text
- [ ] Form fields have associated labels
- [ ] Error messages are announced

### Dynamic Content
- [ ] Live regions announce changes
- [ ] Loading states are communicated
- [ ] Modal dialogs are properly handled
- [ ] Focus management works correctly
```

### Keyboard Navigation Testing

**Testing Procedure:**

1. **Unplug Mouse/Disable Trackpad**
2. **Navigate Using Only Keyboard**
   - Tab: Move forward through interactive elements
   - Shift+Tab: Move backward through interactive elements
   - Enter: Activate buttons and links
   - Space: Activate buttons, toggle checkboxes
   - Arrow Keys: Navigate within components (where appropriate)
   - Escape: Close modals and menus

**Keyboard Testing Checklist:**

```markdown
## Keyboard Navigation Checklist

### Focus Management
- [ ] All interactive elements are reachable via keyboard
- [ ] Focus indicators are clearly visible
- [ ] Focus order is logical and intuitive
- [ ] Focus is not trapped inappropriately
- [ ] Focus returns to appropriate element after modal closes

### Component-Specific Testing
- [ ] Bottom navigation tabs are keyboard accessible
- [ ] Filter chips can be toggled with keyboard
- [ ] Search input accepts keyboard input
- [ ] Modal dialogs can be closed with Escape
- [ ] Dropdown menus work with arrow keys

### Browser Testing
- [ ] Chrome: Full keyboard navigation works
- [ ] Firefox: All keyboard shortcuts function
- [ ] Safari: VoiceOver integration works
- [ ] Edge: Focus indicators visible
```

### High Contrast Mode Testing

**Windows High Contrast Mode:**

1. **Enable High Contrast Mode**
   - Windows Settings > Ease of Access > High Contrast
   - Choose "High Contrast Black" theme

2. **Test All Components**
   - Verify all text is readable
   - Check that interactive elements are visible
   - Ensure focus indicators are prominent
   - Validate that important information isn't lost

**High Contrast Testing Checklist:**

```markdown
## High Contrast Mode Checklist

### Visual Elements
- [ ] All text maintains adequate contrast
- [ ] Borders and outlines are visible
- [ ] Icons and graphics are distinguishable
- [ ] Focus indicators are prominent

### Interactive Elements
- [ ] Buttons are clearly defined
- [ ] Links are distinguishable from text
- [ ] Form fields have visible boundaries
- [ ] Active states are apparent

### Component-Specific
- [ ] Bottom navigation items are clearly separated
- [ ] Filter chips maintain visual hierarchy
- [ ] Search results are easy to distinguish
- [ ] Loading skeletons are visible
```

### Touch Target Testing

**Mobile Device Testing:**

1. **Test on Actual Devices**
   - iOS devices (iPhone, iPad)
   - Android devices (various manufacturers)
   - Different screen sizes and orientations

2. **Touch Target Verification**
   - Minimum 44px × 44px for all interactive elements
   - Adequate spacing between touch targets
   - No accidental activations during normal use

**Touch Target Checklist:**

```markdown
## Touch Target Testing Checklist

### Size Requirements
- [ ] All buttons meet 44px minimum
- [ ] All links meet 44px minimum
- [ ] Form inputs have adequate touch area
- [ ] Close buttons are easily tappable

### Spacing Requirements
- [ ] No overlapping touch targets
- [ ] Adequate spacing between interactive elements
- [ ] Palm rejection works correctly
- [ ] Accidental touches are minimized

### Device-Specific Testing
- [ ] iPhone SE: Small screen compatibility
- [ ] iPhone Pro Max: Large screen usability
- [ ] iPad: Tablet-specific interactions
- [ ] Android phones: Cross-platform consistency
```

## Performance Impact of Accessibility

### Accessibility Performance Testing

**Automated Performance Testing:**

```javascript
// tests/performance/accessibility-performance.test.ts
import { render, screen } from '@testing-library/react';
import { BottomNav } from '@/components/navigation/bottom-nav';

describe('Accessibility Performance', () => {
  test('accessibility features should not impact performance', async () => {
    const startTime = performance.now();
    
    render(<BottomNav />);
    
    // Wait for all accessibility enhancements to load
    await screen.findByRole('navigation');
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Accessibility features should add minimal overhead
    expect(renderTime).toBeLessThan(50); // 50ms threshold
  });

  test('screen reader announcements should not cause layout shifts', async () => {
    let layoutShiftScore = 0;
    
    // Mock layout shift observer
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          layoutShiftScore += entry.value;
        }
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    
    const { rerender } = render(<FilterChips {...props} />);
    
    // Trigger announcement
    fireEvent.click(screen.getByTestId('filter-chip-1'));
    
    // Wait for announcement
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(layoutShiftScore).toBeLessThan(0.1); // CLS threshold
    
    observer.disconnect();
  });
});
```

## Testing Tools and Browser Extensions

### Recommended Testing Tools

1. **axe DevTools** (Browser Extension)
   - Real-time accessibility scanning
   - WCAG compliance reporting
   - Issue prioritization and guidance

2. **WAVE** (Web Accessibility Evaluation Tool)
   - Visual accessibility evaluation
   - Error and warning identification
   - Contrast analysis

3. **Lighthouse** (Built into Chrome)
   - Accessibility scoring
   - Best practices recommendations
   - Performance impact analysis

4. **Color Contrast Analyzers**
   - Colour Contrast Analyser (free desktop app)
   - Contrast ratio web tools
   - Browser extension contrast checkers

### Browser-Specific Testing

**Chrome DevTools Accessibility Features:**

```javascript
// Enable accessibility tree in DevTools
// Elements > Accessibility pane
// Run Lighthouse accessibility audit
// Use CSS Overview for contrast issues
```

**Firefox Accessibility Inspector:**

```javascript
// Developer Tools > Accessibility
// Check for issues tab
// Simulate color vision deficiencies
// Keyboard navigation simulation
```

**Safari Web Inspector:**

```javascript
// Develop > Show Web Inspector > Audit
// Run accessibility audit
// VoiceOver integration testing
// iOS simulator accessibility testing
```

## Ongoing Compliance Monitoring

### Daily Monitoring

**Automated Checks:**

```bash
# Run daily accessibility tests
npm run test:accessibility:daily

# Monitor for new accessibility issues
npm run accessibility:monitor

# Generate accessibility report
npm run accessibility:report
```

**Monitoring Checklist:**

```markdown
## Daily Accessibility Monitoring

### Automated Checks
- [ ] All accessibility tests passing in CI/CD
- [ ] No new axe-core violations detected
- [ ] Performance impact within acceptable limits
- [ ] Cross-browser compatibility maintained

### User Feedback Monitoring
- [ ] Review accessibility-related support tickets
- [ ] Check user feedback for navigation issues
- [ ] Monitor screen reader user reports
- [ ] Track keyboard navigation problems
```

### Weekly Deep Testing

**Comprehensive Testing Schedule:**

- **Monday**: Screen reader testing (NVDA/JAWS)
- **Tuesday**: Keyboard navigation testing
- **Wednesday**: High contrast mode testing
- **Thursday**: Touch target validation
- **Friday**: Cross-browser accessibility testing

### Monthly Accessibility Audits

**Third-Party Accessibility Audit:**

1. **Engage Accessibility Consultant**
   - Comprehensive WCAG 2.1 audit
   - User testing with disabled users
   - Detailed remediation recommendations

2. **Internal Accessibility Review**
   - Component library accessibility assessment
   - New feature accessibility impact analysis
   - Accessibility documentation updates

## Documentation and Training

### Team Training Materials

**Accessibility Training Checklist:**

```markdown
## Team Accessibility Training

### Developer Training
- [ ] WCAG 2.1 guidelines overview
- [ ] Semantic HTML best practices
- [ ] ARIA attributes and usage
- [ ] Testing tools and procedures
- [ ] Common accessibility mistakes

### Designer Training
- [ ] Color contrast requirements
- [ ] Touch target size guidelines
- [ ] Focus indicator design
- [ ] Accessibility-first design principles
- [ ] Screen reader user experience

### QA Training
- [ ] Manual testing procedures
- [ ] Screen reader testing basics
- [ ] Keyboard navigation testing
- [ ] Automated testing tool usage
- [ ] Accessibility bug reporting
```

### Accessibility Documentation

**Component Accessibility Guides:**

Each component should have dedicated accessibility documentation including:

- ARIA attributes and roles used
- Keyboard interaction patterns
- Screen reader behavior
- High contrast mode considerations
- Touch target specifications
- Testing procedures specific to the component

### Accessibility Statement

**Public Accessibility Statement:**

```markdown
# Accessibility Statement for ScentMatch

We are committed to ensuring digital accessibility for people with disabilities. 
We are continually improving the user experience for everyone and applying the 
relevant accessibility standards.

## Conformance Status
The Web Content Accessibility Guidelines (WCAG) defines requirements for 
designers and developers to improve accessibility for people with disabilities. 
It defines three levels of conformance: Level A, Level AA, and Level AAA. 
ScentMatch is partially conformant with WCAG 2.1 level AA.

## Feedback
We welcome your feedback on the accessibility of ScentMatch. Please let us 
know if you encounter accessibility barriers:
- Email: accessibility@scentmatch.com
- Phone: [Phone Number]
```

---

## Emergency Accessibility Response

### Critical Accessibility Issues

**Immediate Response Procedure:**

1. **Identify Severity Level**
   - Critical: Blocks core functionality for disabled users
   - High: Significantly impacts user experience
   - Medium: Creates barriers but workarounds exist
   - Low: Minor improvements needed

2. **Emergency Response (Critical Issues)**
   - Implement temporary fix within 4 hours
   - Deploy hotfix with accessibility team approval
   - Notify affected users through appropriate channels
   - Plan permanent fix within 48 hours

3. **Communication Protocol**
   - Internal team notification via Slack
   - User communication via email/website notice
   - Status page update if service is affected
   - Follow-up with affected users after resolution

---

*This accessibility testing procedures document should be reviewed and updated quarterly to ensure ongoing compliance and effectiveness.*