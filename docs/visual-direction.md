# Visual Direction

## Visual Target

The visual target is old-school 2D pixel platformer energy with strong influence from early side-scrolling console games. The attached inspiration images point to three consistent qualities:

- High readability at a glance
- Saturated color with clean separation between foreground and background
- A strong sense of forward rhythm created by repeating ground pieces, gaps, props, and collectible-like UI cues

Even though one of the references is Mario and another is Kirby, the overall read is still compatible with the "old 2D Sega-type" feel you described because the common thread is not franchise-specific art. It is fast, colorful, screen-readable pixel platforming.

## What To Borrow From The References

### From the Sonic reference

- Fast horizontal motion
- Bold blue sky backdrops
- Chunky, memorable environmental props
- Large negative space that makes moving objects easy to read
- UI counters that feel arcade-like and immediate

### From the Mario reference

- Extremely clear hazard readability
- Distinct tile blocks and layered platform edges
- Strong silhouette separation between player, enemies, and terrain
- Visual hierarchy that lets the player read safe ground instantly

### From the Kirby reference

- Soft but colorful background painting behind sharper foreground sprites
- Playful object scale
- Charming character proportions
- Clear contrast between usable surfaces and decorative scenery

## Overall Feel

The game should feel:

- Fast
- Bright
- Busy in a controlled way
- Slightly stressful
- Playful on the surface, serious underneath

The stress should come from pacing and layout, not from dark visuals.

## Art Direction Rules

### 1. Readability first

Every important gameplay object needs a simple silhouette.

- Player: one strong body shape with one readable head/hair/backpack outline
- Bed: broad low rectangle, instantly recognizable from distance
- Disco ball: hanging or spherical shape with reflective checker detail
- Instagram obstacle: phone-like or app-icon silhouette with a highly visible border
- Door/classroom entrance: tallest and clearest landmark on the right side of the level end

### 2. Foreground and background must separate cleanly

The player and obstacles should sit on high-contrast foreground ground pieces. Backgrounds can be richer, but they should never compete with gameplay objects.

Recommended approach:

- Use softer, lower-detail campus backgrounds
- Keep obstacle outlines darker than the background
- Avoid detailed textures inside collision-critical areas

### 3. Color should be saturated but organized

The references use strong color, but they do not feel random. Each screen usually has:

- One dominant sky/background color
- One dominant ground family
- One or two accent colors for hazards and interactables
- HUD colors that stay stable across the game

Recommended palette direction:

- Sky blue: `#6da9ff`
- Deep blue accent: `#2e5fd6`
- Grass green: `#3fbf5f`
- Dark grass shadow: `#1f6f37`
- Warm dirt: `#c78b4b`
- Dirt shadow: `#8a5b2f`
- Warning red: `#d94a4a`
- Gold/yellow highlight: `#f3c94a`
- Off-white UI text: `#f4f1e8`
- Dark outline: `#1c1c24`

These do not need to be final production values, but the palette should follow this logic.

## Visual Rhythm And Continuity

The player is always being pushed right, so the level art needs a rhythmic structure that supports motion.

Use repeating visual beats such as:

- Short ground sections
- Small gaps or elevation changes
- Decorative props that reinforce speed without blocking play
- Occasional high-contrast obstacle moments
- A clear destination landmark near the end of the week

Continuity matters because the world is not meant to feel like disconnected rooms. It should feel like one continuous student journey from outside pressure into classroom pressure.

## Character Direction

The protagonist should read as an average student, not a superhero.

Visual cues to include:

- Backpack
- Slight forward lean while running
- Compact pixel proportions
- Neutral design without strong gender coding
- Enough facial simplicity that animation reads from movement, not expression detail

Animation priority order:

- Run
- Jump
- Crouch
- Hurt/hit
- Idle/menu pose

## Environment Direction

Suggested week environments should feel like different parts of student life while staying in one visual world:

- Week 1: campus exterior or sidewalk
- Week 2: dorm-adjacent route
- Week 3: nightlife or social distraction route
- Week 4: denser academic corridor or city block
- Week 5: final sprint to campus/classroom

Each environment can shift props and palette emphasis without abandoning the shared visual language.

## UI Direction

The UI should feel like a retro HUD rather than a modern app overlay.

Use:

- Pixel font or bitmap-style display font
- Solid HUD bars or framed counters
- Fixed screen corners for credits, week, timer, and difficulty
- Strong outlines so the HUD remains readable over bright backgrounds

HUD hierarchy:

- Most important: current credits and target
- Second: week number
- Third: quiz timer during classroom phase
- Fourth: difficulty label

## Motion Style

Motion should feel snappy rather than floaty.

- Quick jump rise
- Slightly faster fall
- Clear crouch snap
- Simple hit feedback such as a flash, knockback, or brief shake
- Background parallax should move slower than the foreground to reinforce speed

## What To Avoid

- Muted or realistic color grading
- Tiny detailed sprites that disappear at play speed
- Heavy visual clutter in the collision space
- Modern flat UI with thin typography
- Horror imagery or overly dark symbolism that fights the playful pixel style

## Art Goal In One Line

Make the game look like a fast, colorful, readable 16-bit platformer where the world is playful enough to invite the player in and stressful enough to keep them moving.
