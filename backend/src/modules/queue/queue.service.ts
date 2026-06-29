import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

export interface ErpEvent {
  type: string;
  tenantId?: string;
  userId?: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private consumerTag: string | null = null;
  private onEvent: ((event: ErpEvent) => Promise<void>) | null = null;

  private get url() {
    return process.env.RABBITMQ_URL;
  }

  isConnected() {
    return !!this.channel;
  }

  async onModuleInit() {
    if (!this.url) {
      this.logger.log('RABBITMQ_URL not set — queue disabled');
      return;
    }
    try {
      await this.connect();
    } catch (err) {
      this.logger.warn(`RabbitMQ connect failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    this.connection = await amqp.connect(this.url!);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('erp.events', 'topic', { durable: true });
    this.logger.log('RabbitMQ connected');
  }

  async disconnect() {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag).catch(() => undefined);
    }
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
    this.channel = null;
    this.connection = null;
  }

  async publish(event: ErpEvent, routingKey?: string) {
    const key = routingKey ?? event.type;
    if (!this.channel) {
      if (this.onEvent) await this.onEvent(event);
      return;
    }
    this.channel.publish(
      'erp.events',
      key,
      Buffer.from(JSON.stringify(event)),
      { persistent: true },
    );
  }

  async subscribe(handler: (event: ErpEvent) => Promise<void>) {
    this.onEvent = handler;
    if (!this.url) return;

    if (!this.channel) {
      try {
        await this.connect();
      } catch {
        return;
      }
    }
    if (!this.channel) return;

    const queue = await this.channel.assertQueue('erp.notifications', { durable: true });
    await this.channel.bindQueue(queue.queue, 'erp.events', '#');

    const result = await this.channel.consume(queue.queue, (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as ErpEvent;
        void handler(event).finally(() => this.channel?.ack(msg));
      } catch {
        this.channel?.nack(msg, false, false);
      }
    });
    this.consumerTag = result.consumerTag;
    this.logger.log('RabbitMQ consumer started');
  }
}
