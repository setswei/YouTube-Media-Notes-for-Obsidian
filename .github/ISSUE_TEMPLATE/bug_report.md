---
name: Bug report
about: Create a report to help us improve
title: 'BUG: '
labels: 'bug'
assignees: ''
body:
- type: checkboxes
  attributes:
    label: Troubleshooting
    description: Please check that you've tried the basic troubleshooting steps before opening an issue.
    options:
      - label: I have tried reloading the extension
        required: true
      - label: I have checked that Obsidian is running and can be opened with obsidian:// URLs
        required: true
- type: input
  attributes:
    label: Operating System
    description: What operating system are you using?
    value: operating system
  validations:
    required: true
- type: input
  attributes:
    label: Browser
  validations:
    required: true

---

**Version (please complete the following information):**

- OS: [e.g. Windows]
- Browser [e.g. Chrome, Firefox]
- YouTube Media Notes version: [e.g. 1.0]
- Obsidian version: [e.g. 1.4.5]

**Describe the bug**

A clear and concise description of the bug. If applicable, add screenshots to help explain the problem.

**Expected behavior**

What did you expect to happen?

**YouTube URL where the bug occurs**

The YouTube video URL where you encountered the issue.

**To reproduce**

Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Your settings**

If relevant, please share your extension settings (without any personal information).

**Console logs**

If possible, please open your browser's developer console (F12 or right-click > Inspect > Console) and share any error messages that appear when the bug occurs.
