# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Add Food" [level=1] [ref=e4]
      - generic [ref=e5]:
        - button "Search" [ref=e6]
        - button "Scan Barcode" [ref=e7]
        - button "Manual" [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e11]:
          - textbox "Search for food..." [ref=e12]
          - button [ref=e13]:
            - img [ref=e14]
        - generic [ref=e16]: Search for foods to add to your diary
  - navigation [ref=e17]:
    - generic [ref=e18]:
      - link "Diary" [ref=e19] [cursor=pointer]:
        - /url: /diary
        - img [ref=e21]
        - generic [ref=e23]: Diary
      - link "Add" [ref=e24] [cursor=pointer]:
        - /url: /add
        - img [ref=e26]
        - generic [ref=e28]: Add
      - link "Progress" [ref=e29] [cursor=pointer]:
        - /url: /progress
        - img [ref=e31]
        - generic [ref=e33]: Progress
      - link "Settings" [ref=e34] [cursor=pointer]:
        - /url: /settings
        - img [ref=e36]
        - generic [ref=e39]: Settings
  - button "Open Next.js Dev Tools" [ref=e45] [cursor=pointer]:
    - img [ref=e46]
  - alert [ref=e49]
```