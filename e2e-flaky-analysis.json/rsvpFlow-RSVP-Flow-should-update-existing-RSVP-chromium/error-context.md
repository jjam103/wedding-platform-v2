# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Join Our Wedding" [level=1] [ref=e5]
      - paragraph [ref=e6]: Register to access your personalized wedding portal
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: First Name *
        - textbox "First Name" [ref=e12]:
          - /placeholder: John
      - generic [ref=e13]:
        - generic [ref=e14]: Last Name *
        - textbox "Last Name" [ref=e15]:
          - /placeholder: Doe
      - generic [ref=e16]:
        - generic [ref=e17]: Email Address *
        - textbox "Email Address" [ref=e18]:
          - /placeholder: your.email@example.com
      - button "Register" [ref=e19]
    - paragraph [ref=e21]:
      - text: Already registered?
      - link "Log in here" [ref=e22] [cursor=pointer]:
        - /url: /auth/guest-login
    - paragraph [ref=e24]:
      - text: Need help? Contact us at
      - link "help@example.com" [ref=e25] [cursor=pointer]:
        - /url: mailto:help@example.com
  - alert [ref=e26]
```