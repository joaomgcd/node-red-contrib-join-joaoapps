
var Join = require("./js/join");
var joinapi = require("./js/joinapi");
const util = require("./js/util");
module.exports = function(RED) {
    function JoinMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var globalContext = this.context().global;
        var joinConfig = RED.nodes.getNode(config.joinConfig);
        node.join = new Join(joinConfig.credentials.apikey);
        node.on('input', async function(msg) {
        	var push ={};
            push.deviceIds = node.credentials.deviceId || msg.senderId || msg.deviceId || msg.deviceIds;
            push.deviceNames = node.credentials.deviceName || msg.devices;   
        	push.apikey = joinConfig.credentials.apikey || msg.apikey;
        	push.title = config.title || msg.title;
            push.text = config.text ||  msg.text;
            push.icon = config.icon ||  msg.icon;
            if(!push.text && util.isString(msg.payload)){
                push.text = msg.payload;
            }
            if(!push.text){
                return node.error("text needs to be set", msg);
            }        	
            node.deviceId = globalContext.get("joindeviceid");
        	node.status({fill:"yellow",shape:"dot",text:"Sending..."});
            //node.log(`Sending push: ${JSON.stringify(push)}`)
            try{
                var result = await node.join.sendPush(push,null,{"node":node});
                //node.log(`Push results - Sucess: ${result.success}; Failure: ${result.failure}`);
                var failure = result.firstFailure;
                if(failure){
                    var message = failure.message || "Couldn't send push";
                    node.status({fill:"red",shape:"dot",text:message});
                    return node.error(message, msg);
                }else{
                    node.status({fill:"green",shape:"dot",text:`Sent to ${result.success} device${result.success>1?"s":""}!`});
                    setTimeout(()=>node.status({}),5000);
                }
            }catch(error){
                node.status({fill:"red",shape:"dot",text:error});
                node.error(error, msg);
            }
            node.send(msg);			
        });
    }
    RED.nodes.registerType("join-message",JoinMessageNode, {
        credentials: {
            deviceName: {type:"text",value:""},
            deviceId: {type:"text",value:""}
        }
    });
}