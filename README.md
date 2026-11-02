# Middlebury Engineering Society website

The club website, rebuilt from the old Wix site as plain HTML/CSS/JS and hosted free on GitHub Pages. No build step and no frameworks: edit a file, commit, and the site updates.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About, leadership, board |
| `workshops.html` | Maker Space workshops |
| `projects.html` | Projects overview |
| `soapbox-cars.html` | Soapbox Cars project |
| `see-the-stars.html` | See the Stars project |
| `outreach.html` | Community Outreach |
| `events.html` | Events (update this each semester) |
| `news.html` | News and blog |
| `contact.html` | Contact |

Shared styles live in `css/style.css`, the menu and form script in `js/main.js`, and photos in `images/`.

The folders named like `about-1-1/` hold redirects from the old Wix URLs, so existing links keep working once the domain points here.

## Editing

- **Text:** open the page's `.html` file and change the text between the tags.
- **Events:** in `events.html`, copy an existing `<div class="event">…</div>` block and change the date, title and details.
- **Board members:** in `about.html`, edit the `<div class="person">` blocks under "Meet the Board".
- **Navigation:** the header and footer are repeated in every page. If you add a page, add its link to the header in each file.
- **Photos:** drop a `.jpg` in `images/` (ideally under 1600px wide) and reference it as `images/your-photo.jpg`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Contact forms

There is no server, so the forms open a pre-filled email to engineering@middlebury.edu. To collect submissions in an inbox without the visitor's email app, sign up for a free form service such as [Formspree](https://formspree.io), set each form's `action` to your Formspree URL with `method="POST"`, and remove the form block at the bottom of `js/main.js`.

## Hosting and the domain

The site is served by GitHub Pages from the `main` branch (Settings → Pages). To move `middleburyengineering.com` off Wix:

1. In Settings → Pages → Custom domain, enter `www.middleburyengineering.com` and save (this creates a `CNAME` file).
2. At the domain registrar, point `www` with a CNAME record to `<github-username>.github.io`, and point the apex domain with A records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Once DNS has propagated, tick "Enforce HTTPS".
