slack-command-server
====================
Slack command server is a simple way to build a server that responds to slack slash commands.

Getting Started
===============
1. Clone this repository
2. Configure according to the `Configuration` section
3. Run `node app.js`

Configuration
=============
Configuring the server is simple, you can use any plugin compatible with [slack-command-router](https://github.com/terribly-lazy/slack-command-router), custom or otherwise.

You must define what port for the app to listen on by defining `port: 80`

To use pre-written plugins write your configuration thusly:
```json
{
    "plugins": [
        "slack-roll-command"
    ]
}
```
Or if you have plugins of your own, you can do this:
```json
{
    "local-plugins": [
        "directory/to/plugin.js"
    ]
}
```

Notes
=====
Any `plugins` specified in your configuration will be installed through npm upon starting your server, and any
`local-plugins` will will be loaded relative to the directory in which `app.js` resides.