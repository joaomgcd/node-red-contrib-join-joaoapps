
var fetch = require('node-fetch');
const AutoAppsCommand = require("./js/autoappscommand");

module.exports = function(RED) {
    function JoinReceiveMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var server = RED.nodes.getNode(config.server);
        var variables = [];
        server.events.on("command", command => {
            node.log(`Parsing command "${command}" with variables "${config.variables}"`);
            var autoAppsCommand = new AutoAppsCommand(command,config.variables,{
                "parseNumbers": config.parseNumbers
            });
            var isMatch = autoAppsCommand.isMatch(config.command);
            node.log(`"${config.command}" matches "${autoAppsCommand.command}": ${isMatch}`);
            if(!isMatch) {                
                node.status({});
                return;
            };
            node.status({fill:"green",shape:"dot",text:"Matched Command"});
            var payload = autoAppsCommand.payload;       
            var msg = {"payload":payload};
            node.send(msg);
        });
        var node = this;
    }
    RED.nodes.registerType("join-receive-message",JoinReceiveMessageNode);
}