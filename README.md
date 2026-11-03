# Middlebury Engineering Society website

Login with contact@middlebury-engineering.com

Email is forwarded via cloudfare registrar, and forwarded to whoever is under email routing. Reach out to dhoughton@middlebury.edu if this email needs to be changed.

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

The contact form in `contact.html` is sent through [FormSubmit](https://formsubmit.co), a free service that needs no account. Each message is emailed to contact@middlebury-engineering.com, which Cloudflare Email Routing forwards to the current club inbox.

- **First-time activation:** the very first submission triggers a confirmation email to contact@middlebury-engineering.com. Click the link in it, and every message after that is delivered.
- **Hide the address:** after activating, FormSubmit emails a random alias. Replace `contact@middlebury-engineering.com` in the form's `action` URL with that alias so the address isn't visible in the page source.
- **Change who receives messages:** change the forwarding destination in Cloudflare Email Routing; the form itself doesn't need to change.
- **Thank-you page:** the hidden `_next` field sends people to `https://www.middlebury-engineering.com/thanks.html`. Update it if the domain ever changes.

## SEO

Each page has its own `<title>`, meta description, canonical link, Open Graph/Twitter tags for link previews, and Organization schema (JSON-LD) in the `<head>`. `sitemap.xml` lists the public pages and `robots.txt` points to it. The thank-you, 404 and redirect pages are marked `noindex`.

- **New page:** give it a unique title and description, then add it to `sitemap.xml`.
- **Moving to a custom domain:** find and replace `https://www.middlebury-engineering.com/` with the new address (for example `https://www.middlebury-engineering.com/`) in every file. That updates canonicals, share images, schema, the sitemap, robots.txt and the form's thank-you link. Crawlers only read `robots.txt` at the root of a domain, so it starts working once the site is on its own domain.
- **Get indexed:** add the site in [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`.

## Hosting and the domain

The site is hosted by GitHub Pages from the `main` branch of `middleburyengineering/middlebury-engineering` (Settings → Pages), at **www.middlebury-engineering.com**. The `CNAME` file in this repo tells GitHub Pages the domain; don't delete it.

The domain is managed in Cloudflare, with these DNS records (all set to **DNS only**, grey cloud):

| Type | Name | Content |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `middleburyengineering.github.io` |

`middlebury-engineering.com` without `www` redirects to `www` automatically. HTTPS is handled by GitHub (Settings → Pages → Enforce HTTPS).
