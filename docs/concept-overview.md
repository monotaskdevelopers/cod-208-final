# Concept Overview

## Project Summary

`The Last Semester` is a 2D side-scrolling pixel art game about surviving a student semester. The player controls an average student who is always moving forward through each week while avoiding distractions that represent common student struggles. At the end of each week, the player enters class and completes a timed COD 208 multiple-choice quiz to earn credits toward graduation.

The structure comes directly from the original brief, but the classroom mechanic has been updated from a reaction-based minigame to a quiz-based assignment phase based on the Gemini refinement.

## Core Game Promise

The game should feel like a playable version of student pressure:

- You are always moving forward, whether you feel ready or not.
- Everyday distractions are turned into physical obstacles.
- The classroom phase creates academic pressure through a time limit.
- Graduation depends on how well you survive both movement stress and question stress across all five weeks.

## Core Pillars

### 1. Forward Pressure

The player auto-runs to the right, which keeps momentum constant and reinforces the feeling that the semester never pauses.

### 2. Relatable Obstacles

Beds, partying, and Instagram are not abstract hazards. They are recognizable student distractions that visually communicate the theme without extra explanation.

### 3. Split-Phase Loop

Each week has two different energies:

- Commute phase: platforming, reflexes, movement stress.
- Classroom phase: quiz, time pressure, academic tension.

The contrast between these phases is one of the main identity features of the project.

### 4. Clear Stakes

The player chooses a graduation target before the game starts:

- Easy: 20 credits minimum
- Medium: 26 credits minimum
- Hard: 30 credits minimum

This makes the goal understandable from the start and gives replay value without needing separate content sets.

## Confirmed Game Structure

- 5 weeks total
- 1 platforming commute per week
- 1 classroom quiz per week
- 6 credits available per week through the assignment/quiz
- 1-minute maximum timer per quiz
- Credit tracker and week counter are always visible when relevant
- Difficulty increases every week through higher movement speed and stronger pressure

## Tone and Feel

The tone should not be grim or realistic in a cinematic way. It should be stylized, playful, and slightly satirical on the surface, while still creating stress through speed, timing, and accumulated stakes.

That means:

- Bright, readable pixel visuals
- Cartoon-like obstacle silhouettes
- Fast pacing
- Constant HUD feedback
- Increasing tension through motion and countdown pressure rather than horror imagery

## Design Translation of the Brief

The project brief establishes the semester metaphor, the graduation framing, and the five-level structure. The Gemini refinement clarifies how the player actually interacts with the game:

- The commute is now clearly an auto-run platformer.
- The classroom phase is now an MCQ quiz instead of a rhythm/reaction test.
- Week-to-week difficulty is tied to movement speed.
- The UI must keep credits and week progression visible.

Together, these decisions make the project easier to scope, easier to explain in class, and easier to prototype in p5.js.

## One-Sentence Creative Direction

`The Last Semester` should feel like a bright 16-bit platformer version of academic survival, where every week is a sprint between distractions and deadlines.
