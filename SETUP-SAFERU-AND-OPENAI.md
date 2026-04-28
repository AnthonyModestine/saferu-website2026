# Get SaferU Live + OpenAI – Simple Steps

Do these in order. One thing at a time.

---

## STEP 1: Push your code

1. In Cursor press **Ctrl + `** (opens terminal at bottom).
2. Paste this and press Enter:

```
cd "c:\Users\Modes\SaferU Website 2\build-safer-u-website (3)"
```

3. Paste this and press Enter:

```
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "Deploy"
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

4. If it asks you to sign in to GitHub, do it. When it says "done" or shows no error, go to Step 2.

---

## STEP 2: Fix the site on Vercel (stop 404)

1. Go to **vercel.com** and sign in.
2. Open the project named **saferu-backend**.
3. Click **Settings** → then **Git** (left side).
4. Under "Connected Git Repository" it must say **saferu-website2026**.  
   - If it says **saferu-backend**: click **Disconnect**, then **Connect**, pick **GitHub**, pick **saferu-website2026**, set branch **main**, Save.
5. Click **Deployments** (top).
6. Wait until the top deployment says **Ready** (green).
7. Click **Visit** or open **saferu-backend.vercel.app**. You should see your site, not 404.

---

## STEP 3: Add your OpenAI key

1. Get a key: go to **platform.openai.com** → sign in → **API keys** → **Create new secret key** → copy it.
2. In Vercel, same project (**saferu-backend**): **Settings** → **Environment Variables**.
3. **Key:** type `OPENAI_API_KEY`  
   **Value:** paste your key.  
   Check **Production**. Click **Save**.
4. Go to **Deployments** → click **⋯** on the latest one → **Redeploy**. Wait until it’s **Ready** again.

Done. The PIO tool will now use your OpenAI key: your prompt + their info = the message.

---

## Change the wording (optional)

- Press releases: edit **lib/press-release-ai.ts** – find `SYSTEM_PROMPT` and change the text in the backticks.
- Community posts: edit **lib/community-request-ai.ts** – same thing, `SYSTEM_PROMPT`.

Then run Step 1 again (add, commit, push) so the change goes live.
