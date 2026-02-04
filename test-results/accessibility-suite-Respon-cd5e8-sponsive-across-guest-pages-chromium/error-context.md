# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome to Our Wedding" [level=1] [ref=e5]
      - paragraph [ref=e6]: Log in to view your personalized wedding portal
    - generic [ref=e7]:
      - generic [ref=e8]:
        - button "Email Login" [ref=e9]
        - button "Magic Link" [ref=e10]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - paragraph [ref=e14]: Enter the email address you used when you RSVP'd to log in instantly.
          - generic [ref=e15]: Email Address
          - textbox "Email Address" [ref=e16]:
            - /placeholder: your.email@example.com
        - button "Log In" [disabled] [ref=e17]
    - paragraph [ref=e19]:
      - text: Need help? Contact us at
      - link "help@example.com" [ref=e20] [cursor=pointer]:
        - /url: mailto:help@example.com
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```