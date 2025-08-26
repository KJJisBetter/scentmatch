# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-22-beginner-ai-explanations/spec.md

## Technical Requirements

- **Component Integration**: Modify components/quiz/fragrance-recommendation-display.tsx to use beginner explanation engine instead of current verbose system
- **Engine Activation**: Import and utilize lib/ai-sdk/beginner-explanation-engine.ts in quiz results flow
- **Experience Detection**: Integrate lib/ai-sdk/user-experience-detector.ts to determine when to use beginner vs standard explanations
- **Format Validation**: Ensure 30-40 word count enforcement is active in production
- **API Integration**: Connect existing adaptive prompt system (lib/ai-sdk/adaptive-prompts.ts) to quiz results generation
- **Error Handling**: Implement fallback to standard explanations if beginner engine fails
- **Performance**: Maintain existing quiz response times while adding explanation processing