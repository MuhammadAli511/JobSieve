# Contributing to JobSieve

Thank you for your interest in contributing to JobSieve! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a branch for your changes
5. Make your changes
6. Test your changes thoroughly
7. Submit a pull request

## Development Setup

### Prerequisites

- Google Chrome, Microsoft Edge, or Firefox browser
- Git
- A code editor (VS Code recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuhammadAli511/JobSieve.git
   cd JobSieve
   ```

2. **Load the extension in Chrome/Edge**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the JobSieve folder

3. **Load the extension in Firefox**
   - Open `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file

### Testing Your Changes

1. Make changes to the code
2. Go to `chrome://extensions/` and click the refresh icon on the JobSieve extension
3. Navigate to LinkedIn Jobs (`linkedin.com/jobs/search`)
4. Test the functionality
5. Check the browser console for any errors (Right-click → Inspect → Console)

## How to Contribute

### Types of Contributions

- **Bug fixes**: Fix issues reported in GitHub Issues
- **Features**: Implement new functionality
- **Documentation**: Improve README, add code comments, update guides
- **Selector updates**: Update CSS selectors when LinkedIn changes their UI
- **Performance**: Optimize filtering speed and memory usage
- **Accessibility**: Improve accessibility features

### Contribution Workflow

1. Check existing [issues](https://github.com/MuhammadAli511/JobSieve/issues) or create a new one
2. Comment on the issue to let others know you're working on it
3. Fork and create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes with clear, descriptive commits
5. Test thoroughly on LinkedIn Jobs pages
6. Push to your fork and submit a Pull Request

## Pull Request Process

1. **Before submitting:**
   - Test your changes on LinkedIn Jobs search pages
   - Ensure no console errors are introduced
   - Update documentation if needed
   - Follow the coding guidelines

2. **PR Title Format:**
   - `fix: description` for bug fixes
   - `feat: description` for new features
   - `docs: description` for documentation
   - `refactor: description` for code refactoring

3. **PR Description should include:**
   - What changes were made
   - Why the changes were made
   - How to test the changes
   - Screenshots (if UI changes)

4. **After submitting:**
   - Respond to review feedback
   - Make requested changes
   - Keep the PR updated with the main branch

## Coding Guidelines

### JavaScript Style

- Use ES6+ syntax (const/let, arrow functions, template literals)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Handle errors gracefully

### Code Structure

```javascript
// Good: Descriptive names and clear structure
async function filterJobCards() {
    const jobCards = this.getJobCards();
    
    for (const card of jobCards) {
        if (this.shouldHideCard(card)) {
            this.hideCard(card);
        }
    }
}

// Avoid: Unclear names and nested logic
async function f() {
    document.querySelectorAll('div').forEach(d => {
        if (d.innerText.includes('x')) d.style.display = 'none';
    });
}
```

### Selector Updates

When LinkedIn changes their UI, selectors may break. To update:

1. Use browser DevTools to identify new selectors
2. Update the `selectorConfig` object in `content.js`
3. Add new selectors as fallbacks (don't remove old ones immediately)
4. Test thoroughly before submitting

```javascript
// Example: Adding a new fallback selector
jobCards: {
    primary: '[data-job-id]',
    fallbacks: [
        '[data-occludable-job-id]',
        '.job-card-container',
        '.new-selector-here'  // Add new selectors as fallbacks
    ]
}
```

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove"
- Keep the first line under 72 characters
- Reference issues when applicable: `Fix #123`

```
Good: "Fix company filter not matching partial names"
Good: "Add location filter for remote jobs"
Bad: "Fixed stuff"
Bad: "Updates"
```

## Reporting Bugs

When reporting bugs, please include:

1. **Browser and version** (e.g., Chrome 120)
2. **Extension version** (from manifest.json)
3. **Steps to reproduce** the issue
4. **Expected behavior** vs **actual behavior**
5. **Console errors** (if any)
6. **Screenshots** (if applicable)

Use the [Bug Report template](https://github.com/MuhammadAli511/JobSieve/issues/new?template=bug_report.md) when creating issues.

## Suggesting Features

Feature suggestions are welcome! Please:

1. Check if the feature has already been suggested
2. Explain the use case and benefit
3. Consider how it fits with existing functionality
4. Use the [Feature Request template](https://github.com/MuhammadAli511/JobSieve/issues/new?template=feature_request.md)

## Questions?

If you have questions about contributing, feel free to:

- Open a [Discussion](https://github.com/MuhammadAli511/JobSieve/discussions)
- Comment on a relevant issue
- Reach out to the maintainers

Thank you for contributing to JobSieve!
