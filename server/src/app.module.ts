import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheService } from './cache/cache.service';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('🔌 Configurando Redis Cloud...');
        
        const redisConfig = {
          host: configService.get('REDIS_HOST', 'redis-13225.crce181.sa-east-1-2.ec2.redns.redis-cloud.com'),
          port: parseInt(configService.get('REDIS_PORT', '13225')),
          password: configService.get('REDIS_PASSWORD', 'aopY6uweoMUacvdoJJh8aZvxPDVeJPBO'),
          username: configService.get('REDIS_USERNAME', 'default')
        };

        console.log('📡 Host:', redisConfig.host);
        console.log('🚪 Porta:', redisConfig.port);
        console.log('🔑 Senha configurada:', !!redisConfig.password);
        console.log('👤 Username:', redisConfig.username);

        try {
          const store = await redisStore({
            socket: {
              host: redisConfig.host,
              port: redisConfig.port,
            },
            password: redisConfig.password,
            username: redisConfig.username,
            database: 0,
          });

          console.log('✅ Redis Store configurado com sucesso');
          console.log('🗄️ Usando database: 0');
          
          return { 
            store,
            ttl: 600,
          };
        } catch (error) {
          console.error('❌ Erro ao configurar Redis Store:', error);
          console.log('🔍 Erro completo:', error);
          throw error;
        }
      },
    }),
    ProductsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
  exports: [CacheService],
})
export class AppModule {}