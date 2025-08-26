# Page snapshot

```yaml
- status "Live announcements"
- alert "Important announcements"
- main
- dialog "Navigation":
  - heading "Navigation" [level=2]
  - paragraph: Browse fragrances, take the quiz, and manage your account
  - navigation:
    - heading "Discover" [level=3]
    - button "Browse Fragrances"
    - button "Find Your Match"
    - button "Sample Sets"
    - heading "Learn" [level=3]
    - button "Take Quiz"
    - button "Recommendations"
    - button "Get Started"
    - button "Sign In"
  - button "Close":
    - img
    - text: Close
```