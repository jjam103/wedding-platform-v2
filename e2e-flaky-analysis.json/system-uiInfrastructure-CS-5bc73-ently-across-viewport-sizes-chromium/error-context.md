# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "🌴 Welcome Back" [level=1] [ref=e6]
        - paragraph [ref=e7]: Sign in to your wedding dashboard
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email Address
          - textbox "Email Address" [ref=e11]:
            - /placeholder: your-email@example.com
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]:
            - /placeholder: ••••••••
        - button "Sign In" [ref=e15]
      - paragraph [ref=e17]:
        - text: Don't have an account?
        - link "Sign up" [ref=e18] [cursor=pointer]:
          - /url: /auth/signup
      - link "← Back to home" [ref=e20] [cursor=pointer]:
        - /url: /
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```