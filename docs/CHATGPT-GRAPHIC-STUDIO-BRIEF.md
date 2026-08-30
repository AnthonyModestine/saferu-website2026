# ChatGPT research brief — how to create safety graphics

Copy everything below the line into a **new ChatGPT conversation** (preferably one where you can attach an image and request image generation).

---

I'm building a web app for public safety agencies (police, fire, EMS PIOs). They need to create **16:9 landscape safety graphics** for Facebook/Instagram — the same kind of thing I get when I ask you to make an image here in ChatGPT.

**Please explain your end-to-end process** as if you're teaching a developer how to replicate it with the OpenAI API:

## What our users do

1. Pick a category (e.g. Child & Family Safety)
2. Describe the topic in plain language (e.g. "signs your child might be getting bullied")
3. Pick audience (e.g. Children / Families) and visual style (e.g. Friendly / Family)
4. Optionally describe what should appear in the image
5. **You** draft the headline and main message that will appear **on** the graphic
6. User reviews/edits that text
7. User clicks generate — you create the **final 16:9 image** with:
   - That exact text on the graphic (readable, good margins)
   - Their **department logo** attached by us, placed **bottom-right**, **not altered** (no redraw, recolor, or duplicate)
   - No fake badges or invented seals
   - Professional PIO / public-safety tone

## Questions I need answered

1. **Message step:** How do you turn a rough topic into headline + body copy suitable for on-image text? What rules do you use for length, tone, and accuracy?

2. **Image step:** When I attach a logo image and ask for a 16:9 safety graphic, what model/capability are you using? Is it one call or multiple? Do you generate text and image together or separately?

3. **Logo handling:** Exactly how do you place an attached logo without changing it? What instructions work best?

4. **Layout:** How do you keep text from being clipped at the edges? What margin/safe-zone approach do you use?

5. **API mapping:** If I use the OpenAI API (Responses API, `image_generation` tool, `images.generate`, `images.edit`, etc.), which endpoint and parameters best match what you do in this chat?

6. **Prompt template:** Give me two copy-paste prompt templates:
   - **Template A:** Draft on-graphic message from user inputs
   - **Template B:** Generate the final 16:9 graphic from approved message + attached logo

7. **Example:** Walk through the bullying example above — show the message you'd write and the exact image prompt you'd use.

8. **Failure modes:** What goes wrong with logos (duplicates, redrawn badges, clipped text) and how do you avoid it?

Please be specific and technical. I'm throwing away our old multi-step pipeline (canvas overlays, validation loops, two-step logo placement) and want to rebuild the simplest thing that matches how **you** already do it.

---

## After ChatGPT responds

Paste the full reply back into Cursor. We will use it to implement:

- `lib/graphic-studio/` — one small server module
- `POST /api/pio/graphic-studio/prepare-message`
- `POST /api/pio/graphic-studio/generate`

No events. Safety graphics only.
