
const ip = require("ip");
const web = require("./web");
const USE_LOCAL_SERVER = true;
const JOIN_SERVER_LOCAL = "http://localhost:8080";
const JOIN_SERVER = "https://joinjoaomgcd.appspot.com";
const JOIN_BASE_URL = `${USE_LOCAL_SERVER ? JOIN_SERVER_LOCAL : JOIN_SERVER}/_ah/api/`;
module.exports = {
	//options: apikey,deviceName,port,
	registerInJoinServer : function(node,options){
		var ipAddress = ip.address();
		node.log (`IP Address: ${ipAddress}`);
		var registration = {
			"apikey":options.apikey,
			"regId": `${ipAddress}:${options.port}`,
			"regId2": `${ipAddress}:${options.port}`,
			"deviceName":options.deviceName,
			"deviceType":13
		};
		if(options.deviceId){
			registration.deviceId = options.deviceId;
		}
		return web.post(`${JOIN_BASE_URL}registration/v1/registerDevice/`,registration,node)
		.then(result=>{
    		if(!result.success){
    			return node.error(result.errorMessage);
    		}
			node.log (`Registered device: ${result.deviceId}`);
			return result.deviceId;
    	})
    	.catch(error=>{
    		node.error(error);
        })
	},

	sendPush : function(push){
		return web.post(`${JOIN_BASE_URL}messaging/v1/sendPush`,push);
	}
}