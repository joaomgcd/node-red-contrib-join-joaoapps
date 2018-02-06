
var fetch = require('node-fetch');
module.exports = function(RED) {
    function JoinMessageNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
        	if(!msg.text){
        		return node.error("text needs to be set", msg);
        	}
        	var push ={}
        	push.deviceNames = config.deviceName || msg.devices;
        	push.apikey = config.apiKey || msg.apikey;
        	push.title = config.title || msg.title;
        	push.text = config.text || msg.text;        	
        	this.status({fill:"yellow",shape:"dot",text:"Sending..."});
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
        		this.status({});
        		if(!json.success){
        			return node.error(json.errorMessage, msg);
        		}
            	node.send(msg);
        	})
        	.catch(error=>node.error(error, msg))
			
        });
    }
    RED.nodes.registerType("join-message",JoinMessageNode);
}