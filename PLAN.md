This document outlines the next steps for this game.

# End goal

We are building a single player racing game with the following features:

- The view of the player is top down
- The player is controlling a "circle", which can be a random blob.
- The controlled character is moved through slingshot mechanics
- We want the acceleration mechanism to be inspired from fast FPS like Quake3.
  For this we are going to introduce some subtilities to the slingshot mechanics:
  - The base mechanic is that the longer the swing is, the faster the character will go
  - When slinging one more time, we can add a multiplier to the acceleration generated by the swing depending on a couple parameters:
    - If the character is slowing down, then add a multiplier to the acceleration generated by the sling.
      To calculate the multiplier, it will be proportional to how close the current speed is to the max speed
      generated by the last swing. We want to reward the player for slinging as close as possible to the first decelerating point.
    - We also want to add another multiplier for angle: if we are slinging while the character is moving, we want to increase the multiplier
      for the speed. The multiplier will be at its maximum if the angle is 45 degree, and the multiplier will be at 1 if the character is going in the same direction.
- The different tracks for the race course should be importable from an .svg file.
  - It should be possible to load an SVG file to the game, and then we convert it to a track on the client side.
  - We need to have a system to import an SVG file and convert it to game objects (walls, start line, end line).
    This means we need to define a convention for start and end line in the SVG file.
  - We also going to a system to define start and finish line. We may or may not want checkpoint, i'm not sure right now. I think it's okay
    to skip checkpoint and allow player to exploit tracks and bugs to finish faster.
- We want a ghost replay system
- The HUD should display the current speed and current time on track, with an accuracy of 0.01s
- Regarding the player Field of view, we should zoom out as the speed is going up
- The tracks should be closed walls. Bouncing against a wall should not cause the character to slow down.
- We may want different type of walls and interactive elements on the track in later iterations, but that's not a concern right now.
- Most of the game works client side, i.e. ghost file and track files should be imported and run in the browser.
- We will have as server that keeps tracks of accounts, ghost files and svg files.
- Live Multiplayer is out of scope for this project.

# Current state

We have the SVG track import in a good state. We also have the base gameplay mechanics in place, and that's about that.

# Next step

We want to create a proper dev mode so I can fine tune the game main balance variables while playing it, instead.
So we will want a dev mode where:

- It automatically loads the test track
- It shows the variables in balance.ts and allows me to edit them while playing

Then we also want to try more complex tracks, especially ones with curves.

# Anatomy of a track

The track has a solid background colour that represents it. If the character gets out of bound of the track, then it respawns where it left the track with a speed of 0 (immobile).
The track may have wall to prevent the character to go out of bounds, but the walls may have holes.
Tracks may have solid elements in random places that are acting as obstacles.

## SVG Track Format Conventions

Tracks are defined using specific color codes in SVG files:

- **Track Area (in-bounds)**: `#00FF00` (green) - Where the player can move freely
- **Out-of-bounds Area**: `#FF0000` (red) or absence of track color - Triggers respawn
- **Walls**: `#000000` (black) - Physical barriers that bounce the player
- **Start Line**: `#0000FF` (blue) - 10px wide line/rect marking the start
- **Finish Line**: `#FFD700` (gold) - 10px wide line/rect marking the finish
- **Obstacles**: `#800080` (purple) - Solid elements within the track

Track files are stored in `/public/assets/tracks/` with naming convention `track_[name].svg`.
