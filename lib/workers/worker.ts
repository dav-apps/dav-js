var appId = -1;
var jwt = "";

onmessage = function(e){
	appId = e.data.appId;
	jwt = e.data.jwt;
   subscribe();
}

function subscribe(){
	var channelName = "TableObjectUpdateChannel";
	var webSocket = new WebSocket("ws://localhost:3111/v1/cable?app_id=" + appId + "&jwt=" + jwt);

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
				});
			}
		}
	}
}