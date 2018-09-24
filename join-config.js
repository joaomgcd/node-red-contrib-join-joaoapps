
module.exports = function(RED) {
     function JoinConfigNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        if(node.credentials.apikey){
            node.credentials.apikey = node.credentials.apikey.trim();
        }
        this.apikey = node.credentials.apikey;
        this.deviceName = node.credentials.deviceName;
        this.register = config.register;
        var runSetup = async ()=>{            
            /*var deviceListResult = await joinapi.listDevices(this.apikey);
            if(!deviceListResult.success){
                return node.log(`Couldn't list devices: ${deviceListResult.errorMessage}`); 
            }
            node.devices = deviceListResult.records;*/
            //node.log(`Devices: ${JSON.stringify(node.devices.groupBy(device=>device.deviceType))}`)
            /*var devicesToSendTo = node.devices.filter(device=>device.deviceType == 12);
            var options = {
                "devices": devicesToSendTo,
                "gcmPush": {
                    "push":{"text":"test=:=blabla"}
                },
                "node":node
            }
            var sendResult = await new Sender.SenderIFTTT().send(options);
            node.log(`Send Result: ${JSON.stringify(sendResult)}`)*/
           /* var join = new Join(node.apikey);
            var sendResult = await join.sendCommand("test=:=blabla",device=>device.deviceType == 12);
            node.log(`Send Result: ${JSON.stringify(sendResult)}`)*/
        }
        runSetup();
        
    }
    RED.nodes.registerType("join-config",JoinConfigNode,{
        credentials: {
            apikey: {type:"text",required:true},
            deviceName: {type:"text",value:"Node-RED",required:true}
        }
    });
}