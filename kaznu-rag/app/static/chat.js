const askForm = document.getElementById("askForm");
const questionInput = document.getElementById("questionInput");
const submitBtn = document.getElementById("submitBtn");
const chatFeed = document.getElementById("chatFeed");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const promptGrid = document.getElementById("promptGrid");
const sourcesState = document.getElementById("sourcesState");
const sourcesList = document.getElementById("sourcesList");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatHistory = [];

function appendMessage(role, text) {
  const card = document.createElement("article");
  card.className = `message-card ${role}`;

  const roleLabel = document.createElement("div");
  roleLabel.className = "message-role";
  roleLabel.textContent = role === "user" ? "Ты" : "Ассистент";

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = text;

  card.append(roleLabel, body);
  chatFeed.append(card);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function renderSources(sources) {
  sourcesList.innerHTML = "";
  if (!sources || !sources.length) {
    sourcesState.textContent = "Источники не найдены для этого ответа.";
    sourcesState.classList.remove("hidden");
    sourcesList.classList.add("hidden");
    return;
  }

  sourcesState.classList.add("hidden");
  sourcesList.classList.remove("hidden");

  for (const source of sources) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source;
    item.append(link);
    sourcesList.append(item);
  }
}

async function checkHealth() {
  try {
    const response = await fetch("/health");
    if (!response.ok) throw new Error("Health check failed");
    const data = await response.json();
    statusDot.className = "status-dot online";
    statusText.textContent = `API готово, коллекция: ${data.collection}`;
  } catch (error) {
    statusDot.className = "status-dot offline";
    statusText.textContent = "API недоступно. Проверь запуск FastAPI и Ollama.";
  }
}

async function askQuestion(question) {
  appendMessage("user", question);
  submitBtn.disabled = true;
  submitBtn.textContent = "Ищу ответ...";
  const payload = {
    question,
    history: chatHistory.slice(-8)
  };

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `HTTP ${response.status}`);
    }

    const data = await response.json();
    chatHistory.push({ role: "user", text: question, sources: [] });
    chatHistory.push({ role: "assistant", text: data.answer || "Ответ не получен.", sources: data.sources || [] });
    appendMessage("assistant", data.answer || "Ответ не получен.");
    renderSources(data.sources || []);
  } catch (error) {
    chatHistory.push({ role: "user", text: question, sources: [] });
    chatHistory.push({ role: "assistant", text: `Ошибка запроса: ${error.message}`, sources: [] });
    appendMessage("assistant", `Ошибка запроса: ${error.message}`);
    renderSources([]);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Спросить";
  }
}

askForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;
  questionInput.value = "";
  await askQuestion(question);
});

promptGrid.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const question = target.textContent.trim();
  if (!question) return;
  await askQuestion(question);
});

clearChatBtn.addEventListener("click", () => {
  chatHistory.length = 0;
  chatFeed.innerHTML = "";
  appendMessage("assistant", "Диалог очищен. Задай новый вопрос по КазНУ.");
  renderSources([]);
  questionInput.focus();
});

checkHealth();