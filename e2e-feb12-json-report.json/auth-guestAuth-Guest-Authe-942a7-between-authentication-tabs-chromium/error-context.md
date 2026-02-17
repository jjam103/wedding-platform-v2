# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "Welcome to Our Wedding" [level=1] [ref=e5]
    - paragraph [ref=e6]: Log in to view your personalized wedding portal
  - generic [ref=e7]:
    - tablist [ref=e8]:
      - tab "Email Login" [selected] [ref=e9]
      - tab "Magic Link" [ref=e10]
    - tabpanel "Email Login" [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - paragraph [ref=e15]: Enter the email address you used when you RSVP'd to log in instantly.
          - text: Email Address
          - textbox "Email Address" [ref=e16]:
            - /placeholder: your.email@example.com
        - button "Log In" [ref=e17]
  - paragraph [ref=e19]:
    - text: Need help? Contact us at
    - link "help@example.com" [ref=e20] [cursor=pointer]:
      - /url: mailto:help@example.com
```