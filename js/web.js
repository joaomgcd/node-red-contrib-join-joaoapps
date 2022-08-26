const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
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
	},
	get : function(url, node){
		var options = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}
    	return fetch(url)
    	.then(res=>res.json())
	}
}