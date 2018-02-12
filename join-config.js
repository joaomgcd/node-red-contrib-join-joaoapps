
module.exports = function(RED) {
    function JoinConfigNode(config) {
        RED.nodes.createNode(this,config);
        this.apikey = config.apikey;
        this.deviceName = config.deviceName;
        
    }
    RED.nodes.registerType("join-config",JoinConfigNode,{
        credentials: {
            apikey: {type:"text",required:true},
            deviceName: {type:"text",value:"Node-RED",required:true}
        }
    });
}