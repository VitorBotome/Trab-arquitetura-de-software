<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Redis, Timeout e Circuit Breaker – Guia de Testes

### O que foi implementado
- Cache de produtos e carrinho no Redis Cloud.
- Serviço único de Redis (`RedisService`) usado por produtos e carrinho.
- Delay artificial (~50ms) para simular latência em produtos e carrinho.
- Timeout configurável nas operações do Redis (`set`, `get`, `del`). Padrão: 200ms via `REDIS_TIMEOUT_MS`.
- Circuit Breaker simples no `RedisService`:
  - Abre após 3 falhas consecutivas.
  - Enquanto aberto, falha imediatamente as operações.
  - Após 5s, entra em meia-abertura (1 tentativa). Se der certo, fecha; se falhar, reabre.

### Como iniciar o servidor
```powershell
cd server
npm install
npm run start
```

Para ajustar o timeout (em ms):
```powershell
# Ex.: 200ms (padrão)
$env:REDIS_TIMEOUT_MS=200; npm run start

# Forçar timeouts para demonstrar o circuit breaker (ex.: 1ms)
$env:REDIS_TIMEOUT_MS=1; npm run start
```

### Testes com REST Client (VS Code)

1) Produtos – `server/src/products/product.http`
   - Envie “Listar produtos” e depois “Listar produtos NOVAMENTE”.
     - Esperado: 1ª vez -> MISS; 2ª vez -> HIT; chaves `products:all` e `product:1` aparecem após buscar por id.
   - Envie “Buscar produto 1” e “Buscar produto 1 NOVAMENTE”.
     - Esperado: MISS -> HIT de `product:1`.
   - Envie “GET /products/debug/redis”.
     - Esperado: listar chaves relacionadas (`products:all`, `product:1`).

2) Carrinho – `server/src/cart/cart.http`
   - Envie “Create”. Depois “list cart”. Depois “GET /cart/{id}”.
     - Esperado: chaves `cart:{id}` e `carts:list` no Redis.
   - Opcional: “Delete” e validar remoção.
   - Envie “GET /cart/stats/cache” para ver estatísticas simples (ids e chaves).

### Como validar Timeout e Circuit Breaker

1) Forçando erro com timeout muito baixo
```powershell
cd server
$env:REDIS_TIMEOUT_MS=1; npm run start
```
Com o servidor rodando, no REST Client execute “Listar produtos” algumas vezes em sequência. No console você deverá ver logs como:
- `Timeout 1ms em operação Redis: GET/SET/SETEX`
- Após 3 falhas: `🚫 Circuit Breaker ABERTO por falhas consecutivas`
- Enquanto aberto: `Circuito aberto - bloqueando operação Redis: ...`
- Após ~5s: `⚠️ Circuit Breaker em meia-abertura` (se a tentativa falhar, reabre; se der certo, fecha com `✅ Circuit Breaker fechado após sucesso em meia-abertura`).

2) Voltando ao normal
```powershell
# Reinicie com timeout adequado
$env:REDIS_TIMEOUT_MS=200; npm run start
```
Repita os requests de produtos e carrinho. Esperado: MISS -> HIT, sem abrir o circuito.

### Dicas
- Evite rodar múltiplas instâncias do servidor (erro EADDRINUSE na porta 3000). Se ocorrer:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
- As credenciais do Redis estão no código para fins didáticos. Em produção, use variáveis de ambiente.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
