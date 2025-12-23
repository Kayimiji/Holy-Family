Tutorial Component

What I added:
- `assets/tutorial.css` — styles for tour overlay, tooltip, launch button and demo helpers.
- `assets/tutorial.js` — lightweight Tour class with keyboard controls, spotlight and tooltip positioning. Exposes `window.startTour(steps)` and `window.playTutorialDemo(node)`.

How to use:
- Include `<link rel="stylesheet" href="assets/tutorial.css">` in your `<head>`.
- Add `<button id="tutorialLaunchBtn">🎓 Tour</button>` to your pages (recommended bottom-right). The script auto-binds to this ID.
- Include `<script src="assets/tutorial.js"></script>` at the end of `<body>`.
- To customize steps call: `window.startTour([{selector: '.my-el', title: '...', content: '...'}])`.

Accessibility & notes:
- Keyboard: Esc to end, ArrowLeft/ArrowRight to navigate.
- Steps skip gracefully if selectors aren't present.

If you want me to add page-specific step lists (e.g., for `index.html`, `My-Clinic.html`, `tutorial.html`) I can add those next.

Quick start example (call from a page):

```html
<script>
  const mySteps = [
    { selector: '.sidebar', title: 'Sidebar', content: 'Use this navigation to access features.' },
    { selector: '#bookNowModal', title: 'Book Now', content: 'Open booking modal to schedule appointments.' }
  ];
  document.getElementById('tutorialLaunchBtn').addEventListener('click', () => window.startTour(mySteps));
</script>
```

Notes:
- Steps gracefully skip selectors not present on the page.
- Use `window.playTutorialDemo(document.getElementById('demoBox'))` to trigger the demo animation on `tutorial.html`.