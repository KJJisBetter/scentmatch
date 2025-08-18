# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-18-quiz-ux-professional-improvements/spec.md

## Technical Requirements

### Natural Language Implementation

- Replace pretentious terminology with conversational, friendly language throughout
- Update experience level options: "Just getting started", "I have my favorites", "Love trying new things"
- Use simple, relatable scent descriptions: "Fresh & clean", "Warm & cozy", "Sweet", "Spicy"
- Keep language approachable and natural without trying to sound expert

### Gender Selection Standardization

- Fix "uninex" typo to "unisex" in gender selection component
- Remove "All fragrances" option to focus on specific categories
- Update option values: ["women", "men", "unisex"]
- Maintain professional descriptions for each gender category

### Experience Level Question Restructuring

- **Beginner (4 options)**: Simple combined categories like "Fresh (citrus & aquatic)"
- **Enthusiast (8-10 options)**: Moderate complexity with separated categories
- **Experienced (8-10 options)**: More options but still conversational, not pretentious
- Split "casual & relaxed" into separate "Casual" and "Relaxed" options
- Replace "classical heritage" with natural question like "What type of fragrances do you enjoy most?"

### Question Option Scaling Architecture

- Implement dynamic option rendering based on experience level
- Beginner: 4 simplified options with explanatory descriptions
- Enthusiast/Experienced: 8-10 options with natural, conversational language
- Separate "Fresh" into "Citrus" and "Aquatic" for experienced users
- Add natural occasion categories: "Every day", "Special occasions", "Work", "Date night"

### Results Display Transformation

- Remove AI personality profile generation and display
- Replace with direct fragrance recommendation component
- Show exactly 3 fragrance recommendations with:
  - Brand name and fragrance name (cleaned)
  - Simple, clear scent description using approachable language
  - AI insight explaining match reasoning in natural language
  - Match percentage and sample pricing

### Fragrance Data Cleanup

- Remove malformed naming suffixes like "for Men", "for Women"
- Standardize fragrance names: "Bleu de Chanel" not "Bleu de Chanel for Men"
- Clean up brand and fragrance name presentation in database
- Implement data validation for proper fragrance naming conventions

### Component Architecture Updates

- Update `ExperienceLevelAdaptiveQuiz` component question sets
- Modify `ConversionFlow` component to handle new result format
- Create new fragrance recommendation display component
- Update question option data structures for natural, conversational language

### API Integration Requirements

- Ensure `/api/quiz/analyze-enhanced` returns clean fragrance recommendations
- Update recommendation logic to select exactly 3 fragrances
- Include AI reasoning in response format for each recommendation
- Remove personality profile generation from API response

## External Dependencies (Conditional)

No new external dependencies required - working within existing React, Next.js, and TailwindCSS framework.
