Twitchbot
=============

A simple NodeJS bot for Twitch.

Allows to define commands, intervals, and other dynamic things.

Event listeners can be attached to many events (channel went live, channel hosting, messages, whispers, etc.)

If anyone is interested in using this, I could write a more informative readme.

Command/Interval responses are all stored as simple JS strings. You can however refer to actual native JS commands. Check the example.

One thing to note - the database used by this bot is in fact a simple JS object, that is saved as JSON at a fixed rate (which you can configure), and loaded from JSON at startup.
This means that you can add to it anything you want, and it will be saved and loaded properly, as long as it is JSON-able.
Commands, intervals, channel settings, and so on, are all saved. This means you can add them once when running for the first time, and never touch them again.
