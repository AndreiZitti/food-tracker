# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - heading "404" [level=1] [ref=e5]
      - heading "This page could not be found." [level=2] [ref=e7]
  - navigation [ref=e8]:
    - generic [ref=e9]:
      - link "Diary" [ref=e10] [cursor=pointer]:
        - /url: /diary
        - img [ref=e12]
        - generic [ref=e14]: Diary
      - link "Add" [ref=e15] [cursor=pointer]:
        - /url: /add
        - img [ref=e17]
        - generic [ref=e19]: Add
      - link "Progress" [ref=e20] [cursor=pointer]:
        - /url: /progress
        - img [ref=e22]
        - generic [ref=e24]: Progress
      - link "Settings" [ref=e25] [cursor=pointer]:
        - /url: /settings
        - img [ref=e27]
        - generic [ref=e30]: Settings
  - button "Open Next.js Dev Tools" [ref=e36] [cursor=pointer]:
    - img [ref=e37]
  - alert [ref=e40]
```