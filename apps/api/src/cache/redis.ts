/**
 * Redis Client Configuration
 *
 * Production-ready Redis client with connection management
 */

import { createClient, RedisClientType } from 'redis';

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts = 10;

  async getClient(): Promise<RedisClientType> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    const config: RedisConfig = {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    };

    // Use URL if provided, otherwise construct from individual params
    const connectionUrl = config.url || `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}/${config.db}`;

    this.client = createClient({
      url: connectionUrl,
      socket: {
        reconnectStrategy: (retries) => {
          this.reconnectAttempts = retries;
          if (retries > this.maxReconnectAttempts) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 50, 2000);
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    this.client.on('connect', () => {
      console.log('Redis: Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (err) => {
      console.error('Redis: Error:', err.message);
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    this.client.on('end', () => {
      console.log('Redis: Connection closed');
      this.isConnected = false;
    });

    await this.client.connect();

    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus(): { isConnected: boolean; reconnectAttempts: number } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const redisClient = new RedisClient();
