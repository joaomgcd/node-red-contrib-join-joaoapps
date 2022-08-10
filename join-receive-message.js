const AutoAppsCommand = require("./js/autoappscommand");
const gcm = require("./js/gcm");
const util = require("./js/util");
const Encryption = require("./js/encryption.js");

module.exports = function(RED) {
    function JoinReceiveMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var server = RED.nodes.getNode(config.server);
        const joinConfig =  RED.nodes.getNode(server.config.joinConfig);
        var variables = [];

        var handleIncomingMessage = async command => {

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
            const salt = joinConfig.salt;
            const password = joinConfig.encryptionKey;
            console.log("salt and pass",joinConfig,salt,password);
            if(salt && password){
                command = await Encryption.decrypt(command, password)
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
        node.eventListener = command => {
            //node.log(`Received command from server 2: ${command}`);
            handleIncomingMessage(command);
        };
        //node.log(`Added listener for commands`);
        RED.nodes.getNode(config.server).events.on("command", node.eventListener);
        node.on('input', function(msg) {
            //node.log(`Received command from node input: ${command}`);
            handleIncomingMessage(msg.payload);            
        });
        node.on('close', ()=>{
            //node.log(`Removed listener for commands`);
            server.events.removeListener("command",node.eventListener);
        });
    }
    RED.nodes.registerType("join-receive-message",JoinReceiveMessageNode);
}