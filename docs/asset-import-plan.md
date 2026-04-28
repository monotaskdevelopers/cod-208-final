# Asset Import Plan

## Goal

This document lists the visual, UI, and audio assets that should be prepared or sourced later for implementation. The project should use the attached inspiration only as stylistic reference, not as production art to copy directly.

## Asset Style Rules

- Pixel art only
- Transparent PNG for sprites and UI elements
- Consistent outline treatment across gameplay assets
- Base sprite dimensions should be multiples of `16` where possible
- Scale assets using nearest-neighbor so they keep a crisp pixel edge

## Recommended Future Folder Structure

When assets are added later, this structure will keep them manageable:

```text
assets/
  player/
  obstacles/
  environment/
  ui/
  quiz/
  effects/
  audio/
  data/
```

## Player Assets

### Required

- Main student sprite sheet
- Run animation
- Jump animation
- Crouch animation
- Hit or fail animation
- Idle/menu animation

### Visual notes

- Backpack is the strongest identity marker
- Keep proportions simple and readable at small scale
- Avoid heavy facial detail
- Focus on motion readability first

### Suggested file names

- `assets/player/student_run.png`
- `assets/player/student_jump.png`
- `assets/player/student_crouch.png`
- `assets/player/student_hit.png`
- `assets/player/student_idle.png`

## Obstacle Assets

### Confirmed obstacles from the concept

- Bed
- Disco ball
- Instagram / phone / doomscrolling symbol

### Required treatment

- Each obstacle needs a silhouette readable in less than one second
- Collision area should match the visible shape closely enough for fair gameplay
- Obstacles should have small animation or shimmer only if it does not reduce readability

### Suggested file names

- `assets/obstacles/bed.png`
- `assets/obstacles/disco_ball.png`
- `assets/obstacles/instagram_icon.png`

## Environment Assets

### Terrain

- Ground tile set
- Platform tile set if raised sections are used
- Edge tiles for clean terrain silhouettes

### Backgrounds

- Campus sky background
- Dorm or city route background
- Classroom background
- Optional parallax layers such as trees, buildings, signs, or hallway depth

### Landmarks

- Classroom door sprite
- Campus sign or week-specific marker sprites

### Suggested file names

- `assets/environment/ground_tiles.png`
- `assets/environment/platform_tiles.png`
- `assets/environment/week1_bg.png`
- `assets/environment/week2_bg.png`
- `assets/environment/week3_bg.png`
- `assets/environment/week4_bg.png`
- `assets/environment/week5_bg.png`
- `assets/environment/classroom_door.png`

## UI Assets

### Required HUD assets

- Credits counter frame
- Week counter frame
- Timer frame
- Difficulty badge
- Button states for menus and quiz answers
- Diploma or graduation certificate artwork for ending screen

### Typography

- One pixel-style display font for HUD and menus
- One highly readable text style for quiz questions if the pixel font becomes too hard to read at paragraph length

### Suggested file names

- `assets/ui/hud_panel.png`
- `assets/ui/button_primary.png`
- `assets/ui/button_selected.png`
- `assets/ui/difficulty_badge.png`
- `assets/ui/diploma.png`

## Quiz Assets And Data

### Visual assets

- Classroom background
- Desk, board, or notebook frame for the quiz screen
- Correct and incorrect answer feedback graphics

### Data asset

- JSON file for COD 208 questions, options, and correct answers

Suggested file names:

- `assets/quiz/classroom_bg.png`
- `assets/quiz/answer_correct.png`
- `assets/quiz/answer_wrong.png`
- `assets/data/questions.json`

## Effects And Audio

### Visual effects

- Jump dust or landing puff
- Hit flash
- Door transition effect
- Graduation confetti or shine effect

### Audio

- Menu/select sound
- Jump sound
- Hit sound
- Door/class transition sound
- Quiz countdown warning sound
- Success and fail stingers
- Looping background tracks for commute and classroom phases

## Priority Order For Production

Build assets in this order:

1. Player placeholder sprite and obstacle placeholders
2. Ground tile and one test background
3. Door asset and basic HUD panels
4. Quiz layout assets and `questions.json`
5. Additional weekly backgrounds and polish effects
6. Ending diploma art and final audio pass

## Asset Readiness Checklist

- Can the player sprite be read clearly at gameplay size?
- Can each obstacle be identified instantly?
- Does the HUD remain readable on bright backgrounds?
- Do all imported images share a consistent pixel density?
- Are all assets either original, licensed, or otherwise safe to use for the project?
