# Testing main site and admin

Run `npm run dev`, then:

## Membership shows in admin
1. Main site: Sign up (e.g. /sign-up) with email, name, password.
2. Admin: Open /admin/members. The new member should appear in the list.

## Admin content shows on main site
1. Admin: Articles -> New article. Pick a category (e.g. Crime Prevention) and subcategory (e.g. Home). Add title and description, save.
2. Main site: Open the same category/subcategory (e.g. /crime-prevention/home). The new article should appear.

Data is stored in the `data/` folder (free-members.json, cms-additions.json, content-visibility.json).
