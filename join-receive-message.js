
var fetch = require('node-fetch');
const AutoAppsCommand = require("./js/autoappscommand");
const gcm = require("./js/gcm");
const util = require("./js/util");

module.exports = function(RED) {
    function JoinReceiveMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var server = RED.nodes.getNode(config.server);
        var variables = [];

        var handleIncomingMessage = command => {

            var gcmMessage = gcm.getGcm(node,command);
            var isFullPush = gcmMessage && gcmMessage.push && gcmMessage.push.text;
            if(isFullPush){
                //node.log(`Full push: ${command}`);
                command = gcmMessage.push.text;
            }/*else{
                node.log(`Just command push: ${command}`);
            }*/
//            node.log(`Parsing command "${command}" with variables "${config.variables}"`);
            if(!util.isString(command)){
                return node.error(`Received command must be a string, was of type ${typeof command}`)
            }
            var autoAppsCommand = new AutoAppsCommand(command,config.variables,{
                "parseNumbers": config.parseNumbers
            });
            var isMatch = autoAppsCommand.isMatch(config.command);
            //node.log(`"${config.command}" matches "${autoAppsCommand.command}": ${isMatch}`);
            if(!isMatch) {                
                node.status({});
                return;
            };
            node.status({fill:"green",shape:"dot",text:"Matched Command"});
            var payload = autoAppsCommand.payload;       
            var msg = {};
            msg.payload = payload;
            if(isFullPush){
                msg.push = gcmMessage.push
                msg.senderId = gcmMessage.push.senderId;
            }
            //node.log(`Sending message to flow: ${JSON.stringify(msg)}`);
            node.send(msg);
        }
        server.events.on("command", command => {
            handleIncomingMessage(command);
        });
        node.on('input', function(msg) {
            handleIncomingMessage(msg.payload);            
        });
        var node = this;
    }
    RED.nodes.registerType("join-receive-message",JoinReceiveMessageNode);
}