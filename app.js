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
    var pluginNames = _.keys(pluginsToInstall);
    if (pluginNames.length === 0) {
        callback([]);
        return;
    }
    var npm = require('npm');
    npm.load({}, function (err) {
        if (err) throw err;
        npm.commands["install"](pluginNames, function (err) {
            if (err) throw err;
            var loadedPlugins = [];
            _.forEach(pluginNames, function(name) {
                //Load and configure each plugin
                loadedPlugins.push(require(name)(pluginsToInstall[name]));
            });
            callback(loadedPlugins);
        });
    });
}

function loadPlugins(callback) {
    var pluginNames = _.keys(pluginsToLoad);
    if (pluginNames.length === 0) {
        callback([]);
        return;
    }
    var loadedPlugins = [];
    _.forEach(pluginNames, function(path) {
        //Load and configure each plugin
        loadedPlugins.push(require(path.resolve(__dirname, path))(pluginsToLoad[path]));
    });
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
