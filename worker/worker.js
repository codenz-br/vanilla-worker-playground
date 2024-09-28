// worker.js

/**
 * Worker da Cloudflare para Vanilla AI Playground.
 *
 * Serve página HTML para GET e atua como proxy para o Cloudflare AI Gateway para outras requisições.
 */

const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vanilla AI Playground</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- O conteúdo HTML completo pode ser servido aqui, mas para melhor organização, é recomendado servir arquivos estáticos -->
</body>
</html>
`;

/**
 * Função para lidar com requisições GET.
 * @param {Request} request
 */
async function handleGetRequest(request) {
  console.log("Requisição GET recebida.");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Função para lidar com requisições OPTIONS (CORS Preflight).
 * @param {Request} request
 */
async function handleOptionsRequest(request) {
  console.log("Requisição OPTIONS recebida.");
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 horas
    },
  });
}

/**
 * Função para atuar como proxy para o Cloudflare AI Gateway.
 * @param {Request} request
 * @param {string} gatewayId
 * @param {string} accountId
 * @param {string} apiKey
 */
async function proxy(request, gatewayId, accountId, apiKey) {
  const url = new URL(request.url);

  // Atualizar o caminho para usar o endpoint do Cloudflare AI Gateway
  url.hostname = "gateway.ai.cloudflare.com";
  url.protocol = "https:";
  url.pathname = `/v1/${accountId}/${gatewayId}/workers-ai${url.pathname}`; // Pegar o modelo do path

  console.log(url);

  url.port = ""; // Remove a porta

  console.log("Proxying request to:", url.toString());

  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.body,
    redirect: "follow",
  });

  // Adicionar o cabeçalho de autorização
  modifiedRequest.headers.set("Authorization", `Bearer ${apiKey}`);

  console.log("Modified Request Headers:", [...modifiedRequest.headers]);

  try {
    const response = await fetch(modifiedRequest);
    console.log("Resposta do AI Gateway recebida:", response.status);

    // Clonar a resposta para modificar os cabeçalhos
    const modifiedResponse = new Response(response.body, response);

    // Adicionar cabeçalhos CORS à resposta
    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    return modifiedResponse;
  } catch (error) {
    console.error("Erro no proxy:", error);
    return new Response(error.toString(), { status: 500 });
  }
}

/**
 * Função principal de fetch para o Worker.
 * @param {Request} request
 * @param {Object} env
 */
async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return handleOptionsRequest(request);
  } else if (request.method === "GET") {
    return handleGetRequest(request);
  } else {
    const accountId = env.CLOUDFLARE_AC_ID;
    const gatewayId = env.CLOUDFLARE_GATEWAY_ID;
    const apiKey = env.CLOUDFLARE_API_KEY;
    if (!accountId || !apiKey) {
      console.error("Variáveis de ambiente ausentes.");
      return new Response("Missing environment variables.", { status: 500 });
    }
    return proxy(request, gatewayId, accountId, apiKey);
  }
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (err) {
      console.error("Erro no Worker:", err);
      return new Response(err.toString() || "Unknown error", { status: 500 });
    }
  },
};
