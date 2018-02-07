
var fetch = require('node-fetch');
module.exports = function(RED) {
    function JoinMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            var joinConfig = RED.nodes.getNode(config.apiKey);
        	var push ={}
        	push.deviceNames = config.deviceName || msg.devices;
        	push.apikey = joinConfig.apiKey || msg.apikey;
        	push.title = config.title || msg.title;
        	push.text = config.text || msg.text || msg.payload;
            if(!push.text){
                return node.error("text needs to be set", msg);
            }        	
        	node.status({fill:"yellow",shape:"dot",text:"Sending..."});
        	var options = {
				method: 'POST',
				body: JSON.stringify(push), 
				headers: {
					'Content-Type': 'application/json'
				}
			}
			//this.error(push);
        	fetch(`https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush`,options)
        	.then(res=>res.json())
        	.then(json=>{
        		node.status({});
        		if(!json.success){
        			return node.error(json.errorMessage, msg);
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