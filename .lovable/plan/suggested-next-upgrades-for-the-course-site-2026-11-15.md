# Suggested next upgrades for the course site

These are ordered by how much they help learners. Approve all of them, or tell me which ones to keep.

## 1. Phone and tablet check (quick)
Most readers will use a phone, and I haven't fully tested the site on one yet. I'll go through the home page, a lesson, the curriculum, projects and the tutor panel on a small screen, then fix anything cramped, overlapping or too small to tap.

## 2. Accounts so progress follows the learner (medium)
Right now, finished lessons, project ticks and tutor chats are saved only in the browser they were made in. Adding free sign-in (email or Google) would let learners pick up on any device. Visitors who don't sign in keep working exactly as they do now, and anything they've already done carries over when they first sign in.

## 3. Short quizzes at the end of each lesson (medium)
Turn each lesson's "check your understanding" questions into a quick quiz that gets marked instantly. A lesson would count as finished only after the quiz is passed, which makes the progress tracking mean more.

## 4. Certificate of completion (small, needs #2)
Once all 34 lessons and 6 projects are finished, the learner can download a certificate with their name and the date.

## 5. Site-wide search (small)
A search box in the top ribbon that finds lessons, glossary terms and reference pages as you type.

## 6. Tidy-ups (quick)
- Remove the leftover book PDF file the site no longer uses.
- Add a proper share image (1200x630) for the home page so links look good on WhatsApp, X and LinkedIn.
- Make a new hero photo without the misspelled screen text ("ChatGFT").

## 7. Use your own Grok key for the tutor (medium)
A "Tutor settings" panel, opened from the tutor and the appearance menu, where a learner pastes a free API key from console.x.ai. If they've added a key, the tutor uses Grok on their key. If they haven't, it falls back to the course's built-in AI, and I can switch that off if you only want learners' own keys. The key stays in the learner's own browser, and there's a link that explains how to get one.

## Confirmed
- The photos from the book are free to use, so all of the book's images stay on the site.

## Things only you can confirm
- Whether the "Open in Codespaces" button starts the Taskboard cleanly. I can't test it from here.
- Whether the links between project steps and lessons match your book.

## Technical notes
- #7: the key is saved in localStorage and sent with each tutor request to the existing /api/tutor route. The server uses it once to call xAI's API (createOpenAI with baseURL https://api.x.ai/v1, model grok-4-fast) and never logs or stores it. Without a key, the route keeps using the AI Gateway. An invalid key shows a friendly message.
- #2 turns on Lovable Cloud (sign-in plus a progress table for each user, protected so only that user can read it). Local progress gets merged into it on first sign-in.
- #3 reuses the existing `check[]` data in each lesson and changes when "Mark as finished" can be pressed.
- #5 searches the lesson content the site already bundles, so nothing extra is needed behind the scenes.
