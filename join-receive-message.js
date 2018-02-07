
var fetch = require('node-fetch');
var AutoAppsCommand = function(message, variables){

    var me = this;
    var getPayload = function(){
        var payload = message;
        if(typeof variables == "string"){
                variables = variables.split(",");
        }
        if(!variables || variables.length == 0 || message.indexOf("=:=")<0){
            return payload;
        }
        var commandParts = message.split("=:=");
        if(commandParts.length == 0){
            return payload;
        }
        payload = {"command":commandParts[0]};
        for (var i = 0; i < variables.length && i < commandParts.length- 1 ; i++) {
            var variable = variables[i];
            var commandPart = commandParts[i+1];
            payload[variable] = commandPart;
        }
        return payload;
    }
    this.payload = getPayload();
    this.command = this.payload["command"] ? this.payload.command : this.payload;
    this.isMatch = function(configuredCommand){
        return me.command == configuredCommand;
    }
}
module.exports = function(RED) {
    function JoinReceiveMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var server = RED.nodes.getNode(config.server);
        var variables = [];
        server.events.on("command", command => {
            node.log(`Got message from server: ${command}`);
            var autoAppsCommand = new AutoAppsCommand(command,config.variables);
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