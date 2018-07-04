const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const alerts = [];
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/public/" + "index.html"));
});

app.use('/', express.static(__dirname + "/public/"));


app.get('/alerts', function (req, res, next) {
    console.log("Sending " + alerts.length + " Complex Events");
    res.json(alerts);
});

app.post('/inputs', function (req, res) {
    console.log('Sending message to Kafka: ', req.body.value);

    let kafka = require('kafka-node'),
        Producer = kafka.Producer,
        KeyedMessage = kafka.KeyedMessage,
        client = new kafka.Client(),
        producer = new Producer(client),
        km = new KeyedMessage('key', 'message'),
        payloads = [
            {topic: 'streams-input', messages: req.body.value, partition: 0}
        ];

    producer.on('ready', function () {
        producer.send(payloads, function (err, data) {
            res.send("OK");
        });
    });

});

const server = http.createServer(app);

const io = require('socket.io').listen(server);
// Socket configuration
io.sockets.on('connection', (socket) => {
    console.log("User connected");
});

const kafka = require('kafka-node'),
    Consumer = kafka.Consumer,
    client = new kafka.Client(),
    consumer = new Consumer(client, [{
        topic: 'streams-output',
        partition: 0
    }], {
        autoCommit: false
    });

consumer.on('message', function (message) {
    console.log("*** New complex event received: ", message);
    alerts.push(message.value);
    io.emit('newAlert', 'ok');
});


server.listen(PORT, function () {
    console.log("Server with GUI up and running on localhost:" + PORT);
});