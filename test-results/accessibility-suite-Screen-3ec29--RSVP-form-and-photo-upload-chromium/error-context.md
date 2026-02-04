# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]: 🚫
      - heading "Access Denied" [level=1] [ref=e6]
      - paragraph [ref=e7]: You don't have permission to access this page. This area is restricted to wedding hosts and administrators.
      - generic [ref=e8]:
        - link "Go to Guest Portal" [ref=e9] [cursor=pointer]:
          - /url: /guest/dashboard
        - link "Back to Home" [ref=e10] [cursor=pointer]:
          - /url: /
  - button "Open Next.js Dev Tools" [ref=e16] [cursor=pointer]:
    - img [ref=e17]
  - alert [ref=e20]
```