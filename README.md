# Controller Support for GeoGuessr

Adds basic controller functionality to GeoGuessr, such as being able to move, pan, zoom, control the map, place your guess, and more!

Note that there's no way to control menus inside of the game, as this script is only meant to be used in-game.

# <b>[Install script](https://raw.githubusercontent.com/Rawblocky/geoguessr-controller-support/refs/heads/main/main.user.js)</b>

# Disclaimer

This script was written with the intention of playing in single player. I do not recommend using this script in a multiplayer or competitive setting, as this isn't an official way to play GeoGuessr.

# Settings

You can adjust different settings at the top of the script, as well as their keybindings. A description for each setting is listed.

# Issues

You are currently unable to pan the map during the results screen

# Troubleshooting

Note that this script only works while in a game, and was tested only in classic single player games.

If GeoGuessr isn't detecting your controller inputs, follow these steps:

1. Refresh the page
2. Press a button or move a thumbstick to activate Controller

IF controller glyphs **DON'T** show up (and you have `SHOW_GLYPHS` set to `true` in `SETTINGS`):

- Your controller may not be supported or not connected; try using controller remapping software or another controller to fix this issue

IF controller glyphs **SHOW UP:**

- This means a controller input has been detected, but another controller may be in use instead, as the script will only listen to the controller which made the first input. Try disconnecting all other controllers besides the one you want to use, then refresh.

# 💖 Thanks

- [miraclewhips](https://miraclewhips.dev) for [Compass North Hotkey (N)](https://miraclewhips.dev/#compass-north) script (gave me a lead on how to control the camera)
- [Kenney](https://kenney.nl/) for their free [Kenney Input Prompts](https://kenney.nl/assets/input-prompts) set (used for controller glyphs)
- [SamWaffle2000](https://twitch.tv/SamWaffle2000) for the idea
