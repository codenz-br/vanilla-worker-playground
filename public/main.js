// main.js

/**
 * Classe Chat para gerenciar as interações de chat.
 */
class Chat {
  constructor() {
    // Elementos do DOM
    this.messageEl = document.getElementById("message");
    this.receivingEl = null; // Será criado dinamicamente
    this.promptEl = document.getElementById("prompt");
    this.sendBtn = document.getElementById("sendBtn");
    this.exportBtn = document.getElementById("exportBtn");
    this.voiceBtn = document.getElementById("voiceBtn");
    this.modelsBtn = document.getElementById("modelsBtn");
    this.modelListEl = document.getElementById("modelList");
    this.attentionInput = document.getElementById("attention");

    // Inicializar a instância de markdown-it
    this.md = window.markdownit();

    // Requer acordo
    this.agreed = false;

    this.modelsRequiringAgreement = ["@cf/meta/llama-3.2-11b-vision-instruct"];

    // Configurações iniciais
    this.headers = { "Content-Type": "application/json" };
    this.model = "@cf/mistral/mistral-7b-instruct-v0.1";
    // Configurar o endpoint para desenvolvimento ou produção
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      this.endpoint = `http://localhost:8787/${this.model}`;
      console.log(
        "Modo de desenvolvimento: Endpoint definido para",
        this.endpoint
      );
    } else {
      this.endpoint = `/${this.model}`;
      console.log("Modo de produção: Endpoint definido para", this.endpoint);
    }
    this.attention = 0;
    this.history = [];

    // Controle de requisição
    this.controller = null;

    // Reconhecimento de voz
    this.initSpeechRecognition();

    // Eventos
    this.initEventListeners();
  }

  /**
   * Inicializa o reconhecimento de voz.
   */
  initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Reconhecimento de voz não suportado neste navegador.");
      this.voiceBtn.disabled = true;
      return;
    }

    this.speech = new SpeechRecognition();
    this.speech.lang = "pt-BR";
    this.speech.onresult = (e) => {
      this.promptEl.value = e.results[0][0].transcript;
    };
    this.speech.onerror = (e) => {
      console.error("Erro no reconhecimento de voz:", e.error);
      alert("Erro no reconhecimento de voz: " + e.error);
    };
  }

  /**
   * Inicializa os listeners de eventos.
   */
  initEventListeners() {
    // Enviar prompt ao clicar no botão Send
    this.sendBtn.addEventListener("click", () => this.submit());

    // Exportar conversa
    this.exportBtn.addEventListener("click", () => this.exportConversation());

    // Iniciar reconhecimento de voz
    this.voiceBtn.addEventListener("click", () => this.recognition());

    // Mostrar lista de modelos
    this.modelsBtn.addEventListener("click", () => this.toggleModelList());

    // Selecionar modelo de IA
    this.modelListEl.querySelectorAll("li").forEach((element) => {
      element.addEventListener("click", (event) => {
        this.selectModel(event.target.dataset.model);
      });
    });

    // Atualizar atenção
    this.attentionInput.addEventListener("change", (e) => {
      this.attention = parseInt(e.target.value, 10) || 0;
    });

    // Atalhos de teclado
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        (this.getSubmitKey() !== "ctrl" || event.ctrlKey)
      ) {
        if (this.sendBtn.innerText === "Stop..") {
          event.preventDefault();
          this.abort();
        } else if (this.promptEl.value.trim()) {
          event.preventDefault();
          this.submit();
        }
      }
    });

    // Atualizar endpoint se necessário
    window.onload = () => {
      // Caso precise atualizar o endpoint dinamicamente
      // this.endpoint = "https://playground.pingshan.uk/ai/run/";
      // Pode ser útil se o endpoint depender de alguma lógica
    };
  }

  /**
   * Retorna a tecla de envio selecionada.
   */
  getSubmitKey() {
    const selected = document.querySelector('input[name="submitkey"]:checked');
    return selected ? selected.value : "enter";
  }

  /**
   * Envia o prompt para a API de IA.
   */
  async submit() {
    if (this.sendBtn.innerText === "Stop..") {
      this.abort();
      this.sendBtn.innerText = "Send";
      return;
    }

    const prompt = this.promptEl.value.trim();
    if (!prompt) return;

    this.prompt = prompt;
    this.history.push({
      prompt,
      result: "",
      model: this.model,
      time: new Date(),
    });

    // Atualizar interface
    this.addPromptToMain(prompt);
    this.sendBtn.innerText = "Stop..";

    try {
      if (this.modelsRequiringAgreement.includes(this.model) && !this.agreed) {
        // Enviar 'agree' primeiro
        console.log("Enviando 'agree' para o modelo que requer acordo.");
        this.messageEl.innerHTML += "<br>Enviando acordo ao modelo...";
        await this.stream("agree");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Espera 2 segundo
        this.agreed = true; // Marcar como acordado
        console.log("'agree' enviado com sucesso.");
        this.messageEl.innerHTML +=
          "<br>Acordo aceito. Enviando sua mensagem...";
      }

      // Enviar o prompt do usuário
      await this.stream(prompt);
    } catch (error) {
      console.error("Erro ao enviar o prompt:", error);
      this.onError(error.message);
    }
  }

  /**
   * Adiciona o prompt à seção principal da conversa.
   * @param {string} prompt
   */
  addPromptToMain(prompt) {
    const mainEl = document.getElementById("main");
    const promptEl = document.createElement("h4");
    promptEl.classList.add("prompt");
    promptEl.textContent = prompt;
    promptEl.title = "Clique duas vezes para copiar";
    promptEl.addEventListener("dblclick", () =>
      this.copyToClipboard(this.history.length - 1)
    );
    mainEl.appendChild(promptEl);

    const receivingEl = document.createElement("div");
    receivingEl.id = "receiving";
    receivingEl.textContent = "Receiving....";
    mainEl.appendChild(receivingEl);
    this.receivingEl = receivingEl;

    // Adicionar indicador de envio de acordo
    if (prompt.toLowerCase() === "agree") {
      this.messageEl.innerHTML +=
        "<br><font color='blue'>Acordo sendo enviado...</font>";
    }

    // Rolar para o fim
    document.getElementById("left").scrollTop =
      document.getElementById("left").scrollHeight;
  }

  /**
   * Envia o prompt para a API com suporte a streaming.
   * @param {string} prompt
   */
  async stream(prompt) {
    this.result = "";
    this.body = {
      stream: true,
      messages: [{ role: "user", content: prompt }],
    };
    this.controller = new AbortController();
    const signal = this.controller.signal;

    // Incluir histórico baseado na atenção
    if (this.attention > 0) {
      const start = Math.max(this.history.length - this.attention, 0);
      for (let i = start; i < this.history.length; i++) {
        const convo = this.history[i];
        this.body.messages.unshift({
          role: "assistant",
          content: convo.result,
        });
        this.body.messages.unshift({ role: "user", content: convo.prompt });
      }
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(this.body),
        signal,
      });

      if (!response.ok) {
        if (response.status === 401)
          throw new Error("401 Unauthorized, chave de API inválida.");
        throw new Error(
          `Falha ao obter dados, status de erro ${response.status}`
        );
      }

      const reader = response.body.getReader();
      await this.readStream(reader);
    } catch (error) {
      if (error.name === "AbortError") {
        this.onError("Requisição abortada.");
      } else {
        console.error("Erro na requisição:", error);
        this.onError(error.message);
      }
    }
  }

  /**
   * Lê a resposta em streaming.
   * @param {ReadableStreamDefaultReader} reader
   */
  async readStream(reader) {
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Processar o buffer para tentar extrair JSON completo
        let boundary;
        while ((boundary = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            if (jsonStr === "[DONE]") {
              this.onComplete();
              return;
            }
            try {
              const json = JSON.parse(jsonStr);
              if (json.response) {
                this.result += json.response;
                this.updateReceiving(this.result);
              }
            } catch (error) {
              console.error("Erro ao parsear JSON:", error, "Linha:", line);
              // Opcional: Mostrar erro no frontend
            }
          }
        }
      }
    }

    this.onComplete();
  }

  /**
   * Processa cada pedaço da resposta em streaming.
   * @param {string} chunk
   */
  processStreamChunk(chunk) {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    lines.forEach((line) => {
      if (line === "data: [DONE]") {
        this.onComplete();
        return;
      }
      if (line.startsWith("data: ")) {
        const jsonStr = line.substring(6);
        try {
          const json = JSON.parse(jsonStr);
          if (json.response) {
            this.result += json.response;
            this.updateReceiving(this.result);
          }
        } catch (error) {
          console.error("Erro ao parsear JSON:", error, "Linha:", line);
        }
      }
    });
  }

  /**
   * Atualiza a seção de recebimento com o texto parcial.
   * @param {string} text
   */
  updateReceiving(text) {
    if (this.receivingEl) {
      this.receivingEl.innerHTML = this.md.render(text);
    }
  }

  /**
   * Finaliza o recebimento da mensagem e atualiza o histórico.
   */
  onComplete() {
    this.sendBtn.innerText = "Send";
    this.history[this.history.length - 1].result = this.result;

    // Verificar se o último prompt foi 'agree'
    const lastConvo = this.history[this.history.length - 1];
    if (lastConvo.prompt.toLowerCase() === "agree") {
      console.log("Acordo aceito pelo modelo.");
      // Não atualiza a interface para evitar confusão
    } else {
      this.displayFullConversation();
    }
  }

  /**
   * Exibe a conversa completa no painel principal.
   */
  displayFullConversation() {
    const mainEl = document.getElementById("main");
    mainEl.innerHTML = "";

    this.history.forEach((convo, index) => {
      const promptEl = document.createElement("h4");
      promptEl.classList.add("prompt");
      promptEl.textContent = convo.prompt;
      promptEl.title = "Clique duas vezes para copiar";
      promptEl.addEventListener("dblclick", () => this.copyToClipboard(index));
      mainEl.appendChild(promptEl);

      const responseEl = document.createElement("div");
      responseEl.innerHTML = this.md.render(convo.result);
      mainEl.appendChild(responseEl);

      const stampEl = document.createElement("p");
      stampEl.classList.add("stamp");
      stampEl.textContent = `Modelo: ${
        convo.model
      }, Hora: ${convo.time.toLocaleString()}`;
      mainEl.appendChild(stampEl);
    });

    // Adicionar botões adicionais
    const buttonsDiv = document.createElement("div");

    const redoBtn = document.createElement("button");
    redoBtn.textContent = "Redo";
    redoBtn.style.float = "left";
    redoBtn.addEventListener("click", () => this.redo());
    buttonsDiv.appendChild(redoBtn);

    const speakBtn = document.createElement("button");
    speakBtn.textContent = "🔊 Speak";
    speakBtn.style.float = "right";
    speakBtn.style.marginLeft = "8px";
    speakBtn.addEventListener("click", () => this.speak());
    buttonsDiv.appendChild(speakBtn);

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.style.float = "right";
    copyBtn.addEventListener("click", () =>
      this.copyToClipboard(this.history.length - 1)
    );
    buttonsDiv.appendChild(copyBtn);

    mainEl.appendChild(buttonsDiv);

    // Rolar para o fim
    document.getElementById("left").scrollTop =
      document.getElementById("left").scrollHeight;

    // Limpar ou focar o prompt
    if (window.innerWidth > 800) {
      this.promptEl.select();
      this.promptEl.focus();
    } else {
      this.promptEl.value = "";
    }
  }

  /**
   * Copia a conversa selecionada para a área de transferência.
   * @param {number} index
   */
  copyToClipboard(index) {
    const convo = this.history[index];
    const text = `### ${convo.prompt}\n\n${convo.result}\n\n`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.messageEl.textContent =
          "Diálogo copiado para a área de transferência";
      })
      .catch((err) => {
        console.error("Erro ao copiar para clipboard:", err);
        alert("Erro ao copiar para clipboard.");
      });
  }

  /**
   * Exporta toda a conversa como um arquivo Markdown.
   */
  exportConversation() {
    const content = this.history
      .map((convo) => `### ${convo.prompt}\n\n${convo.result}\n\n`)
      .join("");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().substr(0, 16);
    link.download = `chat-${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Inicia o reconhecimento de voz.
   */
  recognition() {
    if (this.speech) {
      this.speech.start();
      this.promptEl.value = "Listening...";
    }
  }

  /**
   * Alterna a visibilidade da lista de modelos.
   */
  toggleModelList() {
    const listEl = document.getElementById("list");
    listEl.classList.toggle("hidden");
  }

  /**
   * Seleciona um modelo de IA.
   * @param {string} model
   */
  selectModel(model) {
    this.model = model;
    this.messageEl.innerHTML = `Modelo selecionado: ${this.model} @${this.attention}`;

    // Atualizar o endpoint com o novo modelo
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      this.endpoint = `http://localhost:8787/${this.model}`;
    } else {
      this.endpoint = `/${this.model}`;
    }

    console.log("Modelo selecionado:", this.model);
    console.log("Endpoint atualizado para:", this.endpoint);

    // Resetar o estado de acordo
    if (this.modelsRequiringAgreement.includes(this.model)) {
      this.agreed = false;
      console.log("Este modelo requer acordo. 'agree' ainda não foi enviado.");
    } else {
      this.agreed = true; // Não requer acordo
    }

    const listEl = document.getElementById("list");
    if (window.innerWidth < 800) listEl.classList.add("hidden");
  }

  /**
   * Aborta a requisição atual.
   */
  abort() {
    if (this.controller) {
      this.controller.abort();
      this.messageEl.innerHTML +=
        '<br><font color="red">Mensagem abortada!</font>';
      if (this.receivingEl) {
        this.receivingEl.id = "abort";
        this.receivingEl.innerHTML +=
          '<br><font color="red">Mensagem abortada!</font>';
      }
      this.sendBtn.innerText = "Send";
    }
  }

  /**
   * Reenvia o último prompt.
   */
  redo() {
    if (this.history.length === 0) return;
    const lastConvo = this.history.pop();
    this.promptEl.value = lastConvo.prompt;
    this.submit();
  }

  /**
   * Fala a última resposta utilizando síntese de fala.
   */
  speak() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      const lastConvo = this.history[this.history.length - 1];
      if (!lastConvo) return;

      const utterance = new SpeechSynthesisUtterance(lastConvo.result);
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Função de callback para lidar com erros.
   * @param {string} error
   */
  onError(error) {
    console.error("Erro no Chat:", error);
    alert(error);
    this.sendBtn.innerText = "Send";
  }
}

// Inicialização do chat ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  const chat = new Chat();
});
