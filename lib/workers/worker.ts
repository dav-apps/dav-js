var appId = -1;

onmessage = function(e){
	appId = e.data
   subscribe();
}

function subscribe(){
	var channelName = "TableObjectUpdateChannel";
	var webSocket = new WebSocket("ws://localhost:3111/v1/cable?app_id=" + appId + "&jwt=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhdkBkYXYtYXBwcy50ZWNoIiwidXNlcm5hbWUiOiJEYXYiLCJ1c2VyX2lkIjoxLCJkZXZfaWQiOjEsImV4cCI6Mzc1Mzk3MTAzMTN9.5PJstak7mR5IFhJLLahdRgGxkeQWARkEATLOeeiCnO0");

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