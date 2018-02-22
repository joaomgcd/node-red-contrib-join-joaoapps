module.exports = {
	executeGcm : function(node, gcmRaw){
		var gcm = this.getGcm(node,gcmRaw);
		if(!gcm) return;
		gcm.execute(node);
	},
	getGcm : function(node, gcmRaw){
		if(typeof gcmRaw === 'string'){
			try{
				gcmRaw = JSON.parse(gcmRaw);				
			}catch(e){
				return null;
			}
		}
		try{
			var type = gcmRaw.type;
			var json = gcmRaw.json;
			if(!type || !json) return null;
			var gcm = new classes[type]();
		    //node.log(`Found class type ${type}...`);
			gcm.fromJsonString(json);
			return gcm;
		}catch(e){
	        node.log(`Error processing GCM: ${e}`);
		}
		return null;
	}
}

class GCM {
	constructor(){
	}
	execute(node) {
//		node.log(this);
	}
	fromJson(json) {
		for (var prop in json) {
			this[prop] = json[prop];
		}
	}
	fromJsonString(str) {		
		var json = JSON.parse(str);
		this.fromJson(json);

	}
}
class GCMPush extends GCM {
	constructor(){
		super();
	}
	execute(node) {
//		node.log(this);
  	  	node.reportCommand(this.push.text);
	}
}
const classes = {
    GCMPush
};