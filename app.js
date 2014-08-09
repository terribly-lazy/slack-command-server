var connect = require('connect'),
    SlackIncoming = require('slack-command-router'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

var config = JSON.parse(fs.readFileSync("config.json"));

var requiredSetup = ["port"];
if (_.intersection(_.keys(config), requiredSetup).length !== requiredSetup.length) {
    throw {
        message: "Missing required configuration parameters"
    }
}

var slack = new SlackIncoming();

var pluginsToInstall = config.plugins || [],
    pluginsToLoad = config["local-plugins"] || [];

function installPlugins(callback) {
    if (pluginsToInstall.length === 0) {
        callback([]);
        return;
    }
    var npm = require('npm');
    npm.load({}, function (err) {
        if (err) throw err;
        npm.commands["install"](pluginsToInstall, function (err) {
            if (err) throw err;
            var loadedPlugins = [];
            for (var i = 0; i < pluginsToInstall.length; i++) {
                loadedPlugins.push(path.resolve(__dirname, require(pluginsToInstall[i])));
            }
            callback(loadedPlugins);
        });
    });
}

function loadPlugins(callback) {
    var loadedPlugins = [];
    for (var i = 0; i < pluginsToLoad.length; i++) {
        pluginsToLoad.push(require(pluginsToLoad[i]));
    }
    callback(loadedPlugins);
}

function initPlugins(plugins, callback) {
    for (var i = 0; i < plugins.length; i++) {
        slack.registerHandler(plugins[i]);
    }
    callback();
}

function initCallback(callback) {
    return function (loadedPlugins) {
        initPlugins(loadedPlugins, callback);
    }
}

function startApp() {
    var app = connect();
    app.use(slack.getMiddleware());
    app.use(function (req, res) {
        res.writeHead(400);
        res.end("Unable to handle request");
    });
    app.listen(config.port);
}

installPlugins(initCallback(function() {
    loadPlugins(initCallback(startApp));
}));
