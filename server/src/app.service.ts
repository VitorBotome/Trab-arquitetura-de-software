import { Injectable, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    console.log('🔄 Testando conexão com Redis Cloud...');
    
    try {
      // Teste de conexão básica
      await this.cacheManager.set('connection-test', 'Redis Cloud conectado com sucesso!', 10000); // 10 segundos
      
      // Verificação
      const result = await this.cacheManager.get('connection-test');
      console.log('✅ Redis Cloud conectado com sucesso!');
      console.log('📦 Dados recuperados:', result);
      
      // Teste adicional com timestamp
      const timestamp = new Date().toISOString();
      await this.cacheManager.set('timestamp', timestamp, 30000); // 30 segundos
      const retrievedTimestamp = await this.cacheManager.get('timestamp');
      console.log('⏰ Timestamp salvo no Redis:', retrievedTimestamp);
      
      // Teste com objeto JSON
      const testObject = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        createdAt: new Date()
      };
      await this.cacheManager.set('test-object', testObject, 60000); // 1 minuto
      const retrievedObject = await this.cacheManager.get('test-object');
      console.log('📦 Objeto JSON salvo e recuperado:', retrievedObject);
      
      // Teste com métodos do cache manager
      try {
        const store = (this.cacheManager as any).store;
        if (store && store.keys) {
          console.log('🔧 Listando chaves do cache...');
          const keys = await store.keys();
          console.log('🔑 Chaves encontradas:', keys);
        }
      } catch (keysError) {
        console.log('⚠️ Não foi possível listar chaves:', keysError.message);
      }
      
    } catch (error) {
      console.error('❌ Erro ao conectar com Redis Cloud:', error);
      console.log('🔍 Verifique:');
      console.log('   - Credenciais do Redis Cloud');
      console.log('   - Endpoint correto');
      console.log('   - Porta liberada no firewall');
      console.log('   - A conexão com a internet está funcionando');
      console.log('   - A instância Redis está ativa no painel');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getDebugInfo(): Promise<any> {
    try {
      const store = (this.cacheManager as any).store;
      
      // Testa operações básicas
      await this.cacheManager.set('debug-test', 'Teste de debug', 60);
      const debugResult = await this.cacheManager.get('debug-test');
      
      // Lista chaves se possível
      let keys = [];
      try {
        if (store && store.keys) {
          keys = await store.keys();
        }
      } catch (error) {
        console.log('Erro ao listar chaves:', error.message);
      }

      return {
        debugTest: debugResult,
        keys: keys,
        storeInfo: {
          hasStore: !!store,
          hasKeys: !!(store && store.keys),
          storeType: typeof store
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

