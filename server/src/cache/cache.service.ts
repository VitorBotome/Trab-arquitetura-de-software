import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Recupera um valor do cache
  async get<T>(key: string): Promise<T | undefined> {
    try {
      console.log(`🔍 Buscando chave: ${key}`);
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined) {
        console.log(`✅ Cache HIT: ${key}`);
      } else {
        console.log(`❌ Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Erro ao buscar chave ${key}:`, error);
      return undefined;
    }
  }

  // Adiciona ou atualiza um valor no cache
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      console.log(`💾 Salvando no cache: ${key} (TTL: ${ttl}s)`);
      await this.cacheManager.set(key, value, ttl * 1000); // TTL em milissegundos
      console.log(`✅ Chave ${key} salva com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao salvar chave ${key}:`, error);
    }
  }

  // Remove um valor do cache
  async del(key: string): Promise<void> {
    try {
      console.log(`🗑️ Removendo chave: ${key}`);
      await this.cacheManager.del(key);
      console.log(`✅ Chave ${key} removida com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao remover chave ${key}:`, error);
    }
  }

  // Verifica se uma chave existe
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined;
    } catch (error) {
      console.error(`❌ Erro ao verificar existência da chave ${key}:`, error);
      return false;
    }
  }

  // Limpa todo o cache (use com cuidado!)
  async reset(): Promise<void> {
    try {
      console.log('🧹 Limpando todo o cache...');
      // Implementação alternativa para limpar cache
      const store = (this.cacheManager as any).store;
      if (store && store.keys) {
        const keys = await store.keys();
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
        console.log(`✅ ${keys.length} chaves removidas do cache`);
      } else {
        console.log('⚠️ Não foi possível listar chaves para limpeza');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  // Método para listar todas as chaves (para debug)
  async keys(): Promise<string[]> {
    try {
      const store = (this.cacheManager as any).store;
      if (store && store.keys) {
        return await store.keys();
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao listar chaves:', error);
      return [];
    }
  }
}

