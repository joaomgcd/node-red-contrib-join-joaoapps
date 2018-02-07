
module.exports = function(RED) {
    function JoinConfigNode(config) {
        RED.nodes.createNode(this,config);
        this.apiKey = config.apiKey;
        
    }
    RED.nodes.registerType("join-config",JoinConfigNode);
}