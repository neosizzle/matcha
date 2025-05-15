const amqp = require('amqplib');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmq';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const conn_url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}`;

async function consumeQueue() {
  try {
    const connection = await amqp.connect(conn_url);
    const channel = await connection.createChannel();

    const queue = 'hello';

    await channel.assertQueue(queue, { durable: false });

    console.log(`[*] consuming 1 message in "${queue}". To exit press CTRL+C`);

    // await channel.get(
    //   queue,
    //   (msg) => {
    //     if (msg !== null) {
    //       console.log(`[x] Received: ${msg.content.toString()}`);
    //       channel.ack(msg);
    //     }
    //   },
    //   { noAck: false }
    // );

    // // using get, consumes 1 msg at a time
    // let msg = await channel.get(queue, {noAck: false})
    // console.log(`[x] Received: ${msg.content?.toString()}`);

    // using consume, consumes whole queue
    await channel.consume(queue, (msg) => {
        console.log(`[x] Received: ${msg.content?.toString()}`);
    }, {noAck: false}) // change this to true to ack the messages

    await channel.close();
    await connection.close();
    return
    // Optional: keep the process alive until manually exited
    process.on('SIGINT', async () => {
      console.log('\n[*] Closing connection...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('RabbitMQ error:', error);
    process.exit(1);
  }
}

consumeQueue()
.then(() => console.log("OK"))
.catch((e) => console.log(e))

// const global_conn = await amqp.connect(conn_url);
