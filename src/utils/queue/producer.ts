import * as amqp from 'amqplib';
import dotenv from "dotenv";

dotenv.config();

const amqpUrl = process.env.RABBIT_MQ_URL;

interface Message {
  queueName: string;
  [key: string]: any;
}

async function producer(message: Message): Promise<void> {
  try {
    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();

    await channel.assertQueue(message.queueName, { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.sendToQueue(message.queueName, messageBuffer, { persistent: true });


    setTimeout(() => {
      channel.close();
      connection.close();
    }, 500);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

export { producer };
