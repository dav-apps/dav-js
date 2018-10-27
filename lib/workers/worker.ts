var appId = -1;
var jwt = "";
var channelName = "TableObjectUpdateChannel";
var baseUrl = "ws://localhost:3111/v1/";

onmessage = function(e){
	appId = e.data.appId;
	jwt = e.data.jwt;
	if(e.data.channelName){
		channelName = e.data.channelName;
	}
	if(e.data.baseUrl){
		baseUrl = e.data.baseUrl.replace("http", "ws").replace("https", "ws");
	}
   subscribe();
}

function subscribe(){
	var webSocket = new WebSocket(baseUrl + "cable?app_id=" + appId + "&jwt=" + jwt);

	webSocket.onopen = function (e) {
		var json = JSON.stringify({
			command: "subscribe",
			identifier: '{"channel": "' + channelName + '"}'
		});
		webSocket.send(json)
	}

	webSocket.onmessage = function(e){
		var json = JSON.parse(e.data);
		if(json["type"]){
			if(json["type"] == "reject_subscription"){
				webSocket.close();
			}
		}
		
		// Notify the app of the changes
		if(json["message"]){
			var uuid = json["message"]["uuid"]
			var change = json["message"]["change"]

			if(uuid != null && change != null){
				postMessage({
					uuid,
					change
				}, null);
			}
		}
	}
}