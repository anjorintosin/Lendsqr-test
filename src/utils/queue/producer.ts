import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config();

const amqpUrl = `amqps://lnizswzu:z9KnfkQh-zpebU66ruwz11Ls491dM6WX@rattlesnake.rmq.cloudamqp.com/lnizswzu`

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
