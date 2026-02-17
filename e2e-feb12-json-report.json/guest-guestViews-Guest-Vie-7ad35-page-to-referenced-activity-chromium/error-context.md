# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "E2E Test Event" [level=1] [ref=e5]
      - generic [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]: "Type:"
          - generic [ref=e9]: ceremony
        - generic [ref=e10]:
          - generic [ref=e11]: "Start Date:"
          - generic [ref=e12]: 6/1/2026
        - generic [ref=e13]:
          - generic [ref=e14]: "End Date:"
          - generic [ref=e15]: 6/1/2026
        - generic [ref=e16]:
          - generic [ref=e17]: "Location:"
          - generic [ref=e18]: E2E Test Location
        - generic [ref=e19]:
          - generic [ref=e20]: "Status:"
          - generic [ref=e21]: published
      - paragraph [ref=e23]: This is a test event for E2E testing.
    - generic [ref=e24]:
      - heading "Activities" [level=2] [ref=e25]
      - generic [ref=e27]:
        - heading "E2E Test Activity" [level=3] [ref=e28]
        - paragraph [ref=e29]: 6/1/2026, 11:00:00 AM
        - paragraph [ref=e30]: <p>This is a test activity for E2E testing.</p>
    - paragraph [ref=e37]:
      - text: This is test content for the event section. It includes
      - strong [ref=e38]: bold text
      - text: and
      - emphasis [ref=e39]: italic text
      - text: .
  - alert [ref=e40]
```