var amqp = require('amqplib/callback_api');

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'rabbitmq';
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'password';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const conn_url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}`

let conn = null;
let send_channel = null;
let recv_channel = null;

async function get_conn_channel(is_recv) {
	if (!conn)
		conn = await amqp.connect(conn_url);

	if (is_recv && !recv_channel)
	{
		if (!recv_channel)
			recv_channel = await conn.createChannel();
		return (conn, recv_channel)
	}

	if (!send_channel)
		send_channel = await conn.createChannel();
	return [conn, send_channel]
}

exports.send_to_queue = async (queue_name, msg) => {
	const [_, channel] = get_conn_channel(false)
	await channel.assertQueue(queue_name, { durable: false });
	channel.sendToQueue(queue_name, Buffer.from(msg));
	await new Promise(res => setTimeout(res, 10)); // 10ms delay
}

exports.recv_all_from_queue = async (queue_name, is_consume) => {
	const [_, channel] = get_conn_channel(true)
	let messages = []
	await channel.consume(queue_name, (msg) => {
		if (msg && msg.content)
		{
			const msg_json = JSON.stringify(msg.content.toString())
			
			messages.push(msg_json)
			if (is_consume)
				channel.ack(msg)
		}
    }, {noAck: false})
	return messages
}
