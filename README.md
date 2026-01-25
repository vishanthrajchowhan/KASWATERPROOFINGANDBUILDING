# KASWATERPROOFING

## Project Structure

- `backend/` — Node.js backend, database, CSV, and environment files
- `frontend/` — All HTML, CSS, JS, images, and videos

## Deployment Instructions

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start backend server:
   ```bash
   node app.js
   ```
3. Serve frontend files using a static server or your backend (e.g., Express static middleware).
4. Point your domain to your hosting provider and upload all files.

## Notes
- All asset paths in HTML are relative (e.g., `css/style.css`, `js/chat.js`, `images/...`, `videos/...`).
- Gallery and lightbox work with organized image folders.
- No duplicate script loading.
- Backend fetch calls use `/api/...` and are unchanged.
- Do not expose `.env` in production.
