
var fetch = require('node-fetch');
module.exports = {
	post : function(url, obj, node){
		var options = {
			method: 'POST',
			body: JSON.stringify(obj), 
			headers: {
				'Content-Type': 'application/json'
			}
		}
		/*if(node){
			node.log(`Posting: ${options.body}`)
		}*/
    	return fetch(url,options)
    	.then(res=>res.json())
	}
}