# User Flow And Screens

## Full Player Journey

The game should move through a clear sequence of screens and states so the player always knows where they are in the semester.

1. Title screen
2. Difficulty selection
3. Short concept intro
4. Week intro
5. Commute gameplay
6. Classroom entry transition
7. Quiz gameplay
8. Week summary
9. Next week loop or final result
10. Graduation or failure ending
11. Replay or return to title

## Screen Breakdown

### 1. Title screen

Purpose:

- Establish the game's identity immediately
- Show the retro pixel-art tone
- Present the start action clearly

Required elements:

- Game title: `The Last Semester`
- Start prompt
- Optional animated student idle/run loop
- Background with campus or semester-themed scenery

### 2. Difficulty selection

Purpose:

- Let the player commit to a graduation target before the run begins

Required elements:

- Easy: `20 credits`
- Medium: `26 credits`
- Hard: `30 credits`
- Short one-line description for each mode

This screen should make the stakes obvious before the first level starts.

### 3. Concept intro

Purpose:

- Frame the semester goal in one short readable moment

Suggested text direction:

- Survive 5 weeks
- Avoid distractions
- Earn credits through classroom assignments
- Reach your target to graduate

Keep it short. This should feel like arcade setup, not a long story dump.

### 4. Week intro

Purpose:

- Reset the player's focus before each round
- Show that the semester is progressing

Required elements:

- `Week 1`, `Week 2`, and so on
- Current total credits
- Target credits
- Optional short label such as `Commute to Class`

### 5. Commute gameplay

Purpose:

- Deliver the platforming half of the loop

Required elements:

- Auto-running player
- Obstacles arranged with readable rhythm
- Credits HUD
- Week counter
- Door or destination landmark at the end of the route

Transition condition:

- Player reaches the classroom door

### 6. Classroom entry transition

Purpose:

- Cleanly switch energy from reflex platforming to focused academic pressure

Suggested transition options:

- Door opens and scene wipes into the classroom
- Quick zoom or fade into desk/quiz interface
- Short sound cue to signal state change

### 7. Quiz gameplay

Purpose:

- Deliver the second half of the weekly loop
- Give the player a way to earn credits back

Required elements:

- Multiple-choice question prompt
- Answer buttons or answer keys
- Visible `60 second` timer
- Current week
- Current credits

Transition condition:

- Timer expires or quiz is completed

### 8. Week summary

Purpose:

- Show immediate consequences of the week
- Let the player understand whether they are on track to graduate

Required elements:

- Credits earned this week
- Total credits so far
- Selected graduation target
- Short status message such as `On Track`, `At Risk`, or `Need a Stronger Week`

### 9. Final result

Purpose:

- Resolve the semester arc after Week 5

Graduate ending:

- Diploma display
- Final credit total
- Victory framing

Failure ending:

- Missed graduation target
- Final credit total
- Retry prompt

## State Logic Summary

Recommended internal game states:

- `title`
- `difficulty-select`
- `intro`
- `week-intro`
- `commute`
- `door-transition`
- `quiz`
- `week-summary`
- `ending-success`
- `ending-fail`

## UX Rules

- The player should always know the current week.
- The player should always know their credit total.
- Difficulty target should remain visible enough that the goal never becomes abstract.
- The switch from commute to quiz should feel intentional, not abrupt or confusing.
- Menus should stay lightweight and arcade-like.

## Emotional Flow

The intended emotional curve across one week is:

1. Brief setup
2. Immediate movement pressure
3. Relief at reaching the door
4. New pressure from the timer and questions
5. Short evaluation moment
6. Repeat with greater stakes

This rise-and-reset loop is what makes the five-week structure sustainable and understandable.
