const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');
const wss = new WebSocket.Server({port: 19132});
const fs = require("fs");
const http = require("http");


function getTime() {
  var date = new Date();
  var hour = date.getHours() + 9;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  hour = ('0' + hour).slice(-2);
  minute = ('0' + minute).slice(-2);
  second = ('0' + second).slice(-2);
  var time = hour + ':' + minute + ':' + second;
  return time;
}
// ユーザー発言時のイベント登録用JSON文字列を生成する関数
function chat() {
  return JSON.stringify({
    "header": {
      "requestId": uuidv4(), // UUID
      "messagePurpose": "subscribe",
      "version": 1,
      "messageType": "commandRequest"
    },
    "body": {
      "eventName": "PlayerMessage"
      //"eventName": "PlayerChat"
    }
  });
}

command = x => JSON.stringify({
  header: {
    requestId: uuidv4(),
    messagePurpose: "commandRequest",
    version: 1,
    messageType: "commandRequest"
  },
  body: {
    origin: {
      type: "player"
    },
    commandLine: x,
    version: 1
  }
});


  
  // マイクラ側からの接続時に呼び出される関数
wss.on('connection', (ws) => {
  console.log('user connected');
  ws.send(command('say connected'));
  var time = getTime();
  ws.send(command('say 現在時刻: ' + time));
  
    
  function sayTime() {
  ws.send(command('scoreboard players reset * time'));
  var time = getTime();
  ws.send(command('scoreboard players set ' + time + ' time -10'));
};
setInterval(sayTime, 1000);

  //==========================
  var server = http.createServer(function (req, res) {

  if (req.method == "GET") {
  var time = getTime();
    console.log('[' + time + '] GET');
    var url = "public" + (req.url.endsWith("/") ? req.url + "index.html" : req.url);
    if (fs.existsSync(url)) {
      fs.readFile(url, (err, data) => {
        if (!err) {
          res.writeHead(200, {
            "Content-Type": getType(url)
          });
          res.end(data);
        } else {
          res.statusCode = 500;
          res.end();
        }
      });
    } else {
      res.statusCode = 404;
      res.end();
    }
  }

  if (req.method == "POST") {
    var data = '';
    //POSTデータを受けとる
    req.on('data', function (chunk) {
      data += chunk
      if(data.indexOf("=")>=0){
var text = data.substring(data.indexOf("=")+1,data.length);
var decoded = decodeURIComponent(text)
var replaced = decoded.replace( /\+/g , ' ' );
}
var time = getTime();
console.log('[' + time + '] POST: ' + replaced);

ws.send(command(replaced));

    })
    req.on('end', function () {
      //ページ再読み込み
      res.writeHead(301, { Location: "/index.html" });// ●ここな
          res.end();// ●ここだよ
    })
  }
});
  var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log("Web: http://localhost:" + port);
});
//=======================
  
  
  // ユーザー発言時のイベントをsubscribe(titleraw常時実行してると大量にパケット送信されて落ちるので注意
  ws.send(chat());

  // 各種イベント発生時に呼ばれる関数
  ws.on('message', packet => {
    //console.log(packet);
    const res = JSON.parse(packet);
    if (res.header.messagePurpose === 'event' && res.body.properties.MessageType !== 'title' && res.body.properties.Sender !== '外部') {
      let Message = res.body.properties.Message;
      let Sender = res.body.properties.Sender;
      let chatMessage = "<" + Sender + "> " + Message;
      //console.log(eventName);
      console.log(chatMessage);

      ws.send(command('say ' + Message));

      if (res.body.properties.Message.startsWith('time')) {
        let sendTime = getTime();
        ws.send(command('say ' + sendTime));
        console.log(sendTime);
      }


      // 書き込むデータ
      const data = "\n" + chatMessage;
      // 書き込み
      fs.appendFile("log.txt", data, (err) => {
        if (err) throw err;
      });

      //res.body.eventName 'PlayerMessage'
      //res.body.properties.Message.startsWith('build')
    }

  });

  
});


function getType(_url) {
  var types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "svg+xml"
  }
  for (var key in types) {
    if (_url.endsWith(key)) {
      return types[key];
    }
  }
  return "text/plain";
}


console.log('Minecraft: ws://192.168.0.n:19132');
