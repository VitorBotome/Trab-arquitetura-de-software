
## Arquitetura resumida
- `ProductsService` (memória) com cache no Redis por página/seleção de campos.
- `CartService` com carrinho em Redis e rota `POST /cart/add` para adicionar itens.
- `RedisService` centraliza acesso ao Redis e implementa timeout configurável (`REDIS_TIMEOUT_MS`) e Circuit Breaker simples.

## Endpoints principais
- `GET /products?page&limit&fields`
  - Paginação em memória e seleção de campos (ex.: `fields=id,name`).
  - Cache por chave: `products:all:page=<p>:limit=<l>:fields=<fields>` (TTL ~10min).
- `GET /products/:id` – cache individual `product:<id>` (TTL 5min).
- `POST /cart/add` – adiciona item ao carrinho (cria se não existir). Atualiza `cart:<id>` e `carts:list`.
- `GET /cart` | `GET /cart/:id` | `DELETE /cart/:id` | `GET /cart/stats/cache`.

## Timeout e Circuit Breaker
- Timeout: operações `get`, `set`, `del` são limitadas por `REDIS_TIMEOUT_MS` (padrão 200ms).
- Circuit Breaker: abre após 3 falhas consecutivas e fica 5s aberto; depois entra em meia-abertura (1 tentativa). Sucesso fecha; falha reabre.

## Como rodar os testes
1. Subir o servidor
```powershell
cd server
npm install
$env:REDIS_TIMEOUT_MS=200; npm run start
```

2. Baseline (sem aquecimento de cache)
```bash
artillery run teste/baseline-products.yml
```

3. Cache aquecido (HITs)
```bash
artillery run teste/cached-products.yml
```

4. Alta carga no carrinho
```bash
artillery run teste/cart-add.yml
```

> Dica: gere JSON e HTML de saída do Artillery com `-o out.json` e transforme em HTML com `artillery report out.json`.

## Resultados esperados (exemplo)

| Cenário | P95 Latência | RPS | Error rate |
|---|---:|---:|---:|
| Baseline GET /products (MISS) | 60-120ms | 50-80 | 0% |
| Cached GET /products (HIT) | 10-30ms | 150-300 | 0% |
| POST /cart/add (delay 800ms) | ~850-1000ms | 10-30 | 0-2% |

Observações:
- Em ambiente local e link com Redis Cloud, latências variam conforme rede.
- Se `REDIS_TIMEOUT_MS` for muito baixo (ex.: 1ms), espere timeouts e abertura do circuito.


## Conclusão
O cache por página/fields reduz latência e aumenta throughput. O timeout e o Circuit Breaker protegem o app contra instabilidades do Redis, falhando rápido e se recuperando automaticamente.


