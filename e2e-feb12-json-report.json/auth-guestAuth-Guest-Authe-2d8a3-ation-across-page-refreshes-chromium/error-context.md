# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
            - generic [ref=e16]: Email Address
            - textbox "Email Address" [disabled] [ref=e17]:
              - /placeholder: your.email@example.com
              - text: test-w131-1770924496792-gm7nv2dn@example.com
          - button "Logging in..." [disabled] [ref=e18]:
            - generic [ref=e19]:
              - img [ref=e20]
              - text: Logging in...
    - paragraph [ref=e24]:
      - text: Need help? Contact us at
      - link "help@example.com" [ref=e25] [cursor=pointer]:
        - /url: mailto:help@example.com
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - generic [ref=e34]:
      - text: Compiling
      - generic [ref=e35]:
        - generic [ref=e36]: .
        - generic [ref=e37]: .
        - generic [ref=e38]: .
  - alert [ref=e39]
```