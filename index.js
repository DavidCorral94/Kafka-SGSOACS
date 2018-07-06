const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const alerts = [];
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');

const kafka = require('kafka-node');
const Producer = kafka.Producer;
const client = new kafka.Client();
const Consumer = kafka.Consumer;
const consumer = new Consumer(client, [{
    topic: 'streams-output',
    partition: 0
}], {
    autoCommit: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/public/" + "index.html"));
});

app.use('/', express.static(__dirname + "/public/"));


app.get('/alerts', function (req, res) {
    console.log('Sending ' + alerts.length + ' Complex Events');
    res.json(alerts);
});

app.post('/inputs', function (req, res) {
    console.log('Sending message to Kafka: ', req.body.value);

    let client = new kafka.Client(),
        producer = new Producer(client),
        payloads = [
            {topic: 'streams-input', messages: req.body.value, partition: 0, timestamp: Date.now()}
        ];

    producer.on('ready', function () {
        producer.send(payloads, function (err, data) {
            if(err)
                res.status(500).send('Something broke!');
            else
                res.send(data);

            console.log(data);
        });
    });
});

const server = http.createServer(app);

const io = require('socket.io').listen(server);

io.sockets.on('connection', (socket) => {
    console.log("User connected");
});

consumer.on('message', function (message) {
    console.log('New complex event received: ', message.value);
    alerts.push(message.value);
    io.emit('newAlert', 'ok');
});

server.listen(PORT, function () {
    console.log('Server with GUI up and running on localhost:' + PORT);
});