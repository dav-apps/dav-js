importScripts("/ngsw-worker.js");

let angularClient;
self.addEventListener('message', event => {
   if(event.data.init){
      angularClient = event.source;

      /*
      var baseUrl = event.data.baseUrl.replace("http", "ws").replace("https", "ws");
      var appId = event.data.appId;
      var jwt = event.data.jwt;
      var channelName = "PushNotificationChannel";

      var webSocket = new WebSocket(baseUrl + "cable?app_id=" + appId + "&jwt=" + jwt);

      webSocket.onopen = function(e) {
         var json = JSON.stringify({
            command: "subscribe",
            identifier: '{"channel": "' + channelName + '"}'
         });
         webSocket.send(json);
      }

      webSocket.onmessage = function(e){
         var json = JSON.parse(e.data);
         console.log(json)
         if(json["type"]){
            if(json["type"] == "reject_subscription"){
               webSocket.close();
            }
         }

         if(json["type"] != "ping"){
            if(json["message"]){
               angularClient.postMessage(json["message"]);
            }
         }
      }
      */
   }
});

self.addEventListener('push', event => {

});