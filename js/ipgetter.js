
const ip = require("ip");
const web = require("./web");
module.exports = class IpGetter {
    constructor(overrideLocal,overridePublic,logger){
    	this.overrideLocal = overrideLocal;
        this.overridePublic = overridePublic;
        this.logger = logger;
    }
    getIps(){
    	return (this.overridePublic ? Promise.resolve(this.overridePublic) : web.get("http://httpbin.org/ip")
		.then(result=>result.origin)
		.catch(error=>null))
		.then(publicIp=>{
			var localIp = this.overrideLocal || ip.address();
            const indexOfComma = publicIp.indexOf(",");
            this.logger.log("Comma: " + indexOfComma);
            if(indexOfComma>0){
                publicIp = publicIp.substring(0,indexOfComma);
            }
			return {"localIp":localIp,"publicIp":publicIp};
		});
    }
}