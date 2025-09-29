import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService {
  private client: any;
  // Timeout configurável (ms) para operações no Redis
  private readonly requestTimeoutMs: number = parseInt(process.env.REDIS_TIMEOUT_MS || '200');

  // Circuit Breaker simples
  private consecutiveFailures: number = 0;
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttemptAt: number = 0;
  private halfOpenTrialInProgress: boolean = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      this.client = createClient({
        socket: {
          host: 'redis-13225.crce181.sa-east-1-2.ec2.redns.redis-cloud.com',
          port: 13225,
        },
        password: 'aopY6uweoMUacvdoJJh8aZvxPDVeJPBO',
        username: 'default',
        database: 0,
      });

      this.client.on('error', (err: any) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis Client Connected');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
      });

      await this.client.connect();
      console.log('🚀 Redis Service conectado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao conectar Redis Service:', error);
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout ${ms}ms em operação Redis: ${operation}`));
      }, ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private async executeWithResilience<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.circuitState === 'OPEN') {
      if (now < this.nextAttemptAt) {
        throw new Error(`Circuito aberto - bloqueando operação Redis: ${operation}`);
      }
      // Janela para meia-abertura
      this.circuitState = 'HALF_OPEN';
      this.halfOpenTrialInProgress = false;
      console.log('⚠️ Circuit Breaker em meia-abertura');
    }

    if (this.circuitState === 'HALF_OPEN') {
      if (this.halfOpenTrialInProgress) {
        throw new Error(`Circuito meia-abertura - tentativa única já em andamento: ${operation}`);
      }
      this.halfOpenTrialInProgress = true;
    }

    try {
      const result = await this.withTimeout(fn(), this.requestTimeoutMs, operation);
      // Sucesso: resetar falhas e fechar circuito se necessário
      this.consecutiveFailures = 0;
      if (this.circuitState === 'HALF_OPEN') {
        this.circuitState = 'CLOSED';
        this.halfOpenTrialInProgress = false;
        console.log('✅ Circuit Breaker fechado após sucesso em meia-abertura');
      }
      return result;
    } catch (error) {
      this.consecutiveFailures += 1;
      if (this.circuitState === 'HALF_OPEN' || this.consecutiveFailures >= 3) {
        this.circuitState = 'OPEN';
        this.nextAttemptAt = Date.now() + 5000; // 5 segundos
        this.halfOpenTrialInProgress = false;
        console.error('🚫 Circuit Breaker ABERTO por falhas consecutivas');
      }
      throw error;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl && ttl > 0) {
        await this.executeWithResilience('SETEX', () => this.client.setEx(key, ttl, serializedValue));
        console.log(`💾 Chave ${key} salva no Redis (TTL: ${ttl}s)`);
      } else {
        await this.executeWithResilience('SET', () => this.client.set(key, serializedValue));
        console.log(`💾 Chave ${key} salva no Redis (sem expiração)`);
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar chave ${key}:`, error);
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.executeWithResilience<string | null>('GET', () => this.client.get(key));
      if (value) {
        console.log(`✅ Cache HIT: ${key}`);
        return JSON.parse(value as string);
      } else {
        console.log(`❌ Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar chave ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.executeWithResilience('DEL', () => this.client.del(key));
      console.log(`🗑️ Chave ${key} removida do Redis`);
    } catch (error) {
      console.error(`❌ Erro ao remover chave ${key}:`, error);
    }
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys = await this.client.keys(pattern);
      console.log(`🔑 Chaves encontradas (${pattern}):`, keys);
      return keys;
    } catch (error) {
      console.error(`❌ Erro ao listar chaves:`, error);
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`❌ Erro ao verificar existência da chave ${key}:`, error);
      return false;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
      console.log('🧹 Redis limpo completamente');
    } catch (error) {
      console.error('❌ Erro ao limpar Redis:', error);
    }
  }

  async getInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      console.error('❌ Erro ao obter informações do Redis:', error);
      return null;
    }
  }
}
