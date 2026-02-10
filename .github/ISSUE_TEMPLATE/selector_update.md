---
name: Selector Update
about: Report that LinkedIn has changed their UI and selectors need updating
title: "[Selector]: "
labels: selector-update, bug
assignees: ''
---

## Broken Selector
Which filter or feature stopped working?
- [ ] Job card detection
- [ ] Company name extraction
- [ ] Location extraction
- [ ] Job title extraction
- [ ] Other: ___

## Health Status
What does the extension health indicator show in the popup?
- [ ] Working
- [ ] Selector Issues
- [ ] No Jobs Found
- [ ] Offline

## New Selector (if found)
If you've identified the new selector using DevTools, provide it here:

```css
/* Old selector */
.old-selector

/* New selector */
.new-selector
```

## Steps to Find the New Selector
1. Open LinkedIn Jobs Search
2. Right-click on a job card → Inspect
3. Note the relevant HTML structure

## Browser
- **Browser**: (e.g., Chrome 120)
- **Date noticed**: (when did it break?)
