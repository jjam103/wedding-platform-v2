# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "🌴 Welcome Back" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to your wedding dashboard
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: Email Address
        - textbox "Email Address" [ref=e10]:
          - /placeholder: your-email@example.com
      - generic [ref=e11]:
        - text: Password
        - textbox "Password" [ref=e12]:
          - /placeholder: ••••••••
      - button "Sign In" [ref=e13]
    - paragraph [ref=e15]:
      - text: Don't have an account?
      - link "Sign up" [ref=e16] [cursor=pointer]:
        - /url: /auth/signup
    - link "← Back to home" [ref=e18] [cursor=pointer]:
      - /url: /
```