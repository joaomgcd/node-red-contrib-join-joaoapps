
var web = require("./js/web");
module.exports = function(RED) {
    function JoinMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var joinConfig = RED.nodes.getNode(config.joinConfig);
        node.on('input', function(msg) {
        	var push ={}
        	push.deviceNames = config.deviceName || msg.devices;
        	push.apikey = joinConfig.apikey || msg.apikey;
        	push.title = config.title || msg.title;
        	push.text = config.text || msg.text || msg.payload;
            if(!push.text){
                return node.error("text needs to be set", msg);
            }        	
        	node.status({fill:"yellow",shape:"dot",text:"Sending..."});
            web.post(`https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush`,push)
        	.then(result=>{
        		node.status({});
        		if(!result.success){
        			return node.error(result.errorMessage, msg);
        		}
            	node.send(msg);
        	})
        	.catch(error=>{
                node.status({fill:"red",shape:"dot",text:error});
                node.error(error, msg);
            })
			
        });
    }
    RED.nodes.registerType("join-message",JoinMessageNode);
}