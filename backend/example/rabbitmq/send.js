#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmq';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const conn_url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}`

amqp.connect(conn_url, function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        var queue = 'hello';
        var msg = `Hello World! ${Date.now()}`;

        channel.assertQueue(queue, {
            durable: false
        });
        channel.sendToQueue(queue, Buffer.from(msg));

        console.log(" [x] Sent %s", msg);
    });

    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 10);
});