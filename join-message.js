
var Join = require("./js/join");
var joinapi = require("./js/joinapi");
const util = require("./js/util");
const Encryption = require("./js/encryption.js");
module.exports = function(RED) {
    function JoinMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var globalContext = this.context().global;
        var joinConfig = RED.nodes.getNode(config.joinConfig);
        node.join = new Join(joinConfig.credentials.apikey);
        node.on('input', async function(msg) {
        	var push = msg.push || {};
            push.deviceIds = node.credentials.deviceId || msg.senderId || msg.deviceId || msg.deviceIds || push.deviceId || push.deviceIds;
            push.deviceNames = node.credentials.deviceName || msg.devices || push.devices;   
        	push.apikey = joinConfig.credentials.apikey || msg.apikey || push.apikey;
            push.title = config.title || msg.title || push.title;
            push.url = config.url || msg.url || push.url;
            push.text =  config.text ||  msg.text || push.text;
            push.icon = config.notificationicon ||  msg.icon || push.icon;
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
                
                const password = joinConfig.encryptionKey;
                const e = text => Encryption.encrypt(text,password);
                push.text = await e(push.text);
                push.url = await e(push.url);
                push.smsnumber = await e(push.smsnumber);
                push.smstext = await e(push.smstext);
                push.clipboard = await e(push.clipboard);
                push.file = await e(push.file);
                push.files = await e(push.files);
                push.wallpaper = await e(push.wallpaper);
        
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
            deviceName: {type:"text",value:"",required:false},
            deviceId: {type:"text",value:"",required:false}
        }
    });
}