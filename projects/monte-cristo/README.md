---
type: project
title: Monte Cristo
status: active
started: 2026-07-23
---

# Monte Cristo

Become the kind of man who is never caught flat-footed in a social moment — composed, sharp, and present, the way the Count of Monte Cristo would be.

**Status:** Active

## Description

On 2026-07-23 a girl smiled at James on the train and he walked past — not because he didn't notice, and not because he had nothing to say, but because his body and voice froze in the moment. That freeze is the actual problem this project targets: not a lack of knowledge, a lack of composure under a live social moment.

This project builds James into "the Count" — poised, articulate, physically composed, socially fluent — across every part of social presence: how he speaks, what he speaks about, how he stands, walks, sits, breathes, and carries his face. It's broad social mastery, not just dating — the same presence applies to mates, networking, and client conversations for the AI consulting business.

Use the `/monte-cristo` skill (or just mention "the Count", or describe a social situation) for two things:
- **Debrief** — something already happened (like the train) → get it broken down and fixed for next time
- **Scenario advice** — a situation is coming up or comes to mind → get the best option before it happens

The Count speaks his responses aloud (ElevenLabs TTS) rather than just printing text — see `scripts/speak.ps1`.

**The Gentleman's Guide:** the full curriculum, compiled and readable, with a table of contents — [claude.ai/code/artifact/29b58827-c219-41b4-baf9-a43d6e3861c1](https://claude.ai/code/artifact/29b58827-c219-41b4-baf9-a43d6e3861c1). Source is `gentlemans-guide.html`; the skill keeps it in sync with `curriculum/` after every session that adds something new.

## Focus Areas

- **Breathing and nerve control** — defusing the freeze response itself, in real time, in the moment
- **Voice and speech** — tone, pacing, composure, cutting filler
- **Body language** — posture, walk, stance, sitting, hands, eye contact
- **Facial expression and presence** — resting expression, smiling, reading a room, holding frame
- **Reading signals** — recognizing interest and disinterest cues (verbal, proximity, touch) and calibrating the response
- **Conversation and wit** — what to talk about, storytelling, banter, listening
- **A living library of situations** — real scenarios and best responses, growing over time
- **A living library of stories** — James's own material, tightened for actual delivery

## Why This Matters

- Directly fixes the train moment and every version of it that will come up again
- Same presence and composure carries into client meetings and networking for the AI consulting business
- Confidence compounds — every situation debriefed makes the next one easier

## Next Steps
- Run a debrief on the train incident itself as the first real test case
- Set up ElevenLabs (API key + voice ID) so the Count can actually speak — see `.env.example`
- Track situations and patterns in `progress.md`; save session transcripts to `logs/monte-cristo/`
