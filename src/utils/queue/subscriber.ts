import * as amqp from "amqplib";
import * as dotenv from "dotenv";
import { creditPersonWallet, debitPersonWallet, processTransfer } from "../walletUtils";

dotenv.config();

const amqpUrl = `amqps://lnizswzu:z9KnfkQh-zpebU66ruwz11Ls491dM6WX@rattlesnake.rmq.cloudamqp.com/lnizswzu`;

interface Message {
  queueName: string;
  userId: string;
  type: string;
  amount: number;
  recipientId: string;
}

const messageHandlers: Record<string, (msg: Message) => Promise<void>> = {
  credit_wallet: async (msg) => await creditPersonWallet(msg.userId, msg.amount),
  debit_wallet: async (msg) => await debitPersonWallet(msg.userId, msg.amount),
  process_transfer: async (msg) => await processTransfer(msg.userId, msg.recipientId, msg.amount),
};

async function subscriber(): Promise<void> {
  try {
    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();

    const queueName = "lendsqr";
    await channel.assertQueue(queueName, { durable: true });

    channel.consume(
      queueName,
      async (msg: any) => {
        if (msg !== null) {
          const message: Message = JSON.parse(msg.content.toString());
          const handler = messageHandlers[message.type];

          if (handler) {
            try {
              await handler(message);
              channel.ack(msg);
            } catch (error) {
              console.error(`Error processing ${message.queueName}:`, error);
              channel.nack(msg, false, true);
            }
          } else {
            console.warn(`No handler for queue: ${message.queueName}`);
            channel.ack(msg);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error receiving messages:", error);
  }
}

export { subscriber };
