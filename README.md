# Middlebury Engineering Society website

The club website, rebuilt from the old Wix site as plain HTML/CSS/JS and hosted free on GitHub Pages. No build step and no frameworks: edit a file, commit, and the site updates.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About, story, board |
| `dual-degree.html` | Dartmouth dual degree and the yearly panel |
| `bridge-competition.html` | Bridge building competition |
| `workshops.html` | Makerspace workshops |
| `outreach.html` | Community outreach |
| `contact.html` | Contact form |
| `thanks.html` | Shown after the contact form is sent |

Shared styles live in `css/style.css`, the mobile menu script in `js/main.js`, and photos in `images/`.

The folders named like `about-1-1/` and the stub files `projects.html`, `events.html`, etc. are redirects from old URLs, so existing links keep working.

## Editing

- **Text:** open the page's `.html` file and change the text between the tags.
- **Board members:** in `about.html`, edit the `<div class="person">` blocks under "Meet the Board".
- **Navigation:** the header menus and footer are repeated in every page. If you add a page, add its link to the matching dropdown (`.dropdown-menu`) and the footer in each file.
- **Photos:** drop a `.jpg` in `images/` (ideally under 1600px wide) and reference it as `images/your-photo.jpg`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Contact forms

The contact form in `contact.html` is sent through [FormSubmit](https://formsubmit.co), a free service that needs no account. Each message is emailed to benhorwitz05@gmail.com, with a copy to dhoughton@middlebury.edu (the hidden `_cc` field).

- **First-time activation:** the very first submission triggers a confirmation email to benhorwitz05@gmail.com. Click the link in it, and every message after that is delivered.
- **Hide the address:** after activating, FormSubmit emails a random alias. Replace `benhorwitz05@gmail.com` in the form's `action` URL with that alias so the address isn't visible in the page source.
- **Change recipients:** edit the `action` URL (main recipient) and the `_cc` value (comma-separated copies). A new main recipient has to activate again.
- **Custom domain:** the hidden `_next` field sends people to `thanks.html` on the github.io address. Update it if the site moves to a custom domain.

## SEO

Each page has its own `<title>`, meta description, canonical link, Open Graph/Twitter tags for link previews, and Organization schema (JSON-LD) in the `<head>`. `sitemap.xml` lists the public pages and `robots.txt` points to it. The thank-you, 404 and redirect pages are marked `noindex`.

- **New page:** give it a unique title and description, then add it to `sitemap.xml`.
- **Moving to a custom domain:** find and replace `https://middleburyengineering.github.io/` with the new address (for example `https://www.middleburyengineering.com/`) in every file. That updates canonicals, share images, schema, the sitemap, robots.txt and the form's thank-you link. Crawlers only read `robots.txt` at the root of a domain, so it starts working once the site is on its own domain.
- **Get indexed:** add the site in [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`.

## Hosting and the domain

The site is served by GitHub Pages from the `main` branch (Settings → Pages). To move `middleburyengineering.com` off Wix:

1. In Settings → Pages → Custom domain, enter `www.middleburyengineering.com` and save (this creates a `CNAME` file).
2. At the domain registrar, point `www` with a CNAME record to `<github-username>.github.io`, and point the apex domain with A records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Once DNS has propagated, tick "Enforce HTTPS".
