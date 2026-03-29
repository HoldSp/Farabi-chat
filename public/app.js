function $(id) {
  return document.getElementById(id);
}

const socket = io();

let FACULTIES = {};
let presenceIntervalId = null;

const pageMeta = {
  dashboard: {
    title: "Главная",
    subtitle: "Персональный dashboard для студентов КазНУ"
  },
  chat: {
    title: "Чаты",
    subtitle: "Каталог факультетов, специальностей, домов студентов и избранных комнат"
  },
  announcements: {
    title: "Объявления",
    subtitle: "Важные новости и информационные сообщения"
  },
  events: {
    title: "Мероприятия",
    subtitle: "События, встречи, лекции и жизнь кампуса"
  },
  faculties: {
    title: "Факультеты",
    subtitle: "Факультеты и их внутренние студенческие сообщества"
  },
  students: {
    title: "Студенты",
    subtitle: "Нетворкинг и студенческое комьюнити внутри платформы"
  },
  profile: {
    title: "Профиль",
    subtitle: "Личные данные, nickname и персональные настройки"
  },
  admin: {
    title: "Админ-панель",
    subtitle: "Права доступа, мероприятия, объявления и модерация"
  }
};

const fallbackFacultiesData = [
  {
    title: "ФМО",
    text: "Международные отношения, дипломатия, международное право и аналитика.",
    tags: ["ФМО", "Сообщество", "Чаты"]
  },
  {
    title: "Юрфак",
    text: "Право, moot court, исследования и учебные проекты.",
    tags: ["Право", "Студенты", "Исследования"]
  },
  {
    title: "IT / CS",
    text: "Код, AI, стартапы, хакатоны и командные проекты.",
    tags: ["Код", "AI", "Разработка"]
  },
  {
    title: "Экономика",
    text: "Финансы, аналитика, кейсы и карьерные события.",
    tags: ["Экономика", "Карьера", "Финансы"]
  }
];

const studentsData = [
  {
    title: "Алихан Серик",
    text: "ФМО • 1 курс • интересы: право, дебаты, международные проекты"
  },
  {
    title: "Dana K.",
    text: "IT / CS • 2 курс • интересы: frontend, backend, AI"
  },
  {
    title: "Aruzhan M.",
    text: "Экономика • 3 курс • интересы: аналитика, кейсы, клубы"
  },
  {
    title: "Nursultan A.",
    text: "Юрфак • 2 курс • интересы: research, law, moot court"
  }
];

const appState = {
  allChats: [],
  activeRoomId: "global",
  activeChatFilter: "favorites",
  chatSearch: ""
};

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const sections = Array.from(document.querySelectorAll(".section"));

const authScreen = $("authScreen");
const appShell = $("appShell");
const appSidebar = $("appSidebar");
const sidebarOverlay = $("sidebarOverlay");
const sidebarToggle = $("sidebarToggle");
const sidebarClose = $("sidebarClose");
const themeToggle = $("themeToggle");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");
const topbarRole = $("topbarRole");

const usernameInput = $("username");
const messageInput = $("messageInput");
const messagesDiv = $("messages");
const sendBtn = $("sendBtn");
const roomSelect = $("room");
const roomList = $("roomList");
const chatRoomTitle = $("chatRoomTitle");
const chatRoomSubtitle = $("chatRoomSubtitle");
const chatRoomMeta = $("chatRoomMeta");
const favoriteRoomBtn = $("favoriteRoomBtn");
const chatSearchInput = $("chatSearchInput");
const favoritesTabBtn = $("favoritesTabBtn");
const allChatsTabBtn = $("allChatsTabBtn");
const recommendedChatChips = $("recommendedChatChips");
const emptyChatState = $("emptyChatState");

const sidebarAvatar = $("sidebarAvatar");
const sidebarName = $("sidebarName");
const sidebarEmail = $("sidebarEmail");
const sidebarFaculty = $("sidebarFaculty");
const sidebarSpecialty = $("sidebarSpecialty");
const sidebarCourse = $("sidebarCourse");
const sidebarDerivedName = $("sidebarDerivedName");
const openProfileBtn = $("openProfileBtn");
const logoutBtn = $("logoutBtn");
const goToChatBtn = $("goToChatBtn");
const heroOpenChatsBtn = $("heroOpenChatsBtn");
const heroOpenProfileBtn = $("heroOpenProfileBtn");
const dashboardBrowseChatsBtn = $("dashboardBrowseChatsBtn");

const heroPrimaryContext = $("heroPrimaryContext");
const favoriteCount = $("favoriteCount");
const dashboardFavoriteCount = $("dashboardFavoriteCount");
const totalChatsCount = $("totalChatsCount");
const dashboardRecommendedChats = $("dashboardRecommendedChats");
const dashboardFavoriteChats = $("dashboardFavoriteChats");

const editDisplayName = $("editDisplayName");
const editEmail = $("editEmail");
const editFaculty = $("editFaculty");
const editSpecialty = $("editSpecialty");
const editCourse = $("editCourse");
const editRealName = $("editRealName");
const editBio = $("editBio");
const saveProfileEditBtn = $("saveProfileEditBtn");

const announcementsList = $("announcementsList");
const eventsList = $("eventsList");
const facultiesList = $("facultiesList");
const studentsList = $("studentsList");
const eventsCount = $("eventsCount");

const eventTitle = $("eventTitle");
const eventDescription = $("eventDescription");
const eventDate = $("eventDate");
const eventPlace = $("eventPlace");
const eventFaculty = $("eventFaculty");
const eventTags = $("eventTags");
const addEventBtn = $("addEventBtn");

const announcementTitle = $("announcementTitle");
const announcementText = $("announcementText");
const announcementMeta = $("announcementMeta");
const addAnnouncementBtn = $("addAnnouncementBtn");

const newAdminEmail = $("newAdminEmail");
const makeAdminBtn = $("makeAdminBtn");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text ?? "";
  return div.innerHTML;
}

function capitalize(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

function parseKaznuNameFromEmail(email) {
  const localPart = String(email || "").trim().toLowerCase().split("@")[0];
  const [lastNamePart = "", firstNamePart = ""] = localPart.split("_");
  return {
    firstName: capitalize(firstNamePart),
    lastName: capitalize(lastNamePart)
  };
}

function getInitials(name) {
  const value = String(name || "").trim();
  return value ? value.charAt(0).toUpperCase() : "A";
}

function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

function buildDisplayName(user) {
  const explicitName = String(user?.displayName || "").trim();
  if (explicitName) return explicitName;

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  if (fullName) return fullName;

  return "Аноним";
}

function setTooltip(element, text) {
  if (element) {
    element.title = text || "";
  }
}

function getFavoritesStorageKey() {
  const user = getCurrentUser();
  return user?.email ? `favoriteChats:${user.email}` : "favoriteChats:guest";
}

function getLastRoomStorageKey() {
  const user = getCurrentUser();
  return user?.email ? `lastChatRoom:${user.email}` : "lastChatRoom:guest";
}

function getFavoriteRoomIds() {
  try {
    const raw = localStorage.getItem(getFavoritesStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavoriteRoomIds(roomIds) {
  localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(roomIds));
}

function isFavoriteRoom(roomId) {
  return getFavoriteRoomIds().includes(roomId);
}

function toggleFavoriteRoom(roomId) {
  const next = new Set(getFavoriteRoomIds());
  if (next.has(roomId)) {
    next.delete(roomId);
  } else {
    next.add(roomId);
  }
  saveFavoriteRoomIds(Array.from(next));
  renderAllDynamicPanels();
}

function saveLastRoomId(roomId) {
  localStorage.setItem(getLastRoomStorageKey(), roomId);
}

function getLastRoomId() {
  return localStorage.getItem(getLastRoomStorageKey()) || "global";
}

function buildChatCatalog() {
  const chats = [
    {
      id: "global",
      title: "Общий чат",
      subtitle: "Главный поток для всех студентов КазНУ.",
      group: "general",
      tags: ["Общий", "Кампус"]
    },
    {
      id: "general:study-help",
      title: "Учёба и дедлайны",
      subtitle: "Обсуждение предметов, дедлайнов, сессии и помощи по учебе.",
      group: "general",
      tags: ["Учёба", "Дедлайны"]
    },
    {
      id: "general:events",
      title: "Мероприятия КазНУ",
      subtitle: "Лекции, форумы, клубы, ивенты и студенческие встречи.",
      group: "general",
      tags: ["События", "Нетворкинг"]
    },
    {
      id: "general:marketplace",
      title: "Маркетплейс студентов",
      subtitle: "Обмен вещами, услуги, совместные покупки и полезные объявления.",
      group: "general",
      tags: ["Маркет", "Объявления"]
    }
  ];

  const facultyNames = Object.keys(FACULTIES).sort((left, right) => left.localeCompare(right, "ru"));

  facultyNames.forEach((facultyName) => {
    chats.push({
      id: `faculty:${facultyName}`,
      title: facultyName,
      subtitle: `Основной чат факультета ${facultyName}.`,
      group: "faculty",
      faculty: facultyName,
      tags: ["Факультет", facultyName]
    });

    (FACULTIES[facultyName] || []).forEach((specialtyName) => {
      chats.push({
        id: `specialty:${facultyName}:${specialtyName}`,
        title: specialtyName,
        subtitle: `Чат специальности ${specialtyName} на факультете ${facultyName}.`,
        group: "specialty",
        faculty: facultyName,
        specialty: specialtyName,
        tags: ["Специальность", facultyName]
      });
    });
  });

  for (let dormNumber = 1; dormNumber <= 18; dormNumber += 1) {
    chats.push({
      id: `dorm:${dormNumber}`,
      title: `Дом студентов ${dormNumber}`,
      subtitle: `Обсуждение жизни, быта и новостей в доме студентов ${dormNumber}.`,
      group: "dorm",
      dorm: dormNumber,
      tags: ["Общежитие", `ДС ${dormNumber}`]
    });
  }

  return chats;
}

function findChatById(roomId) {
  return appState.allChats.find((chat) => chat.id === roomId) || null;
}

function getRecommendedChats(limit = 4) {
  const user = getCurrentUser();
  const result = [];

  function pushIfFound(predicate) {
    const chat = appState.allChats.find(predicate);
    if (chat && !result.some((item) => item.id === chat.id)) {
      result.push(chat);
    }
  }

  pushIfFound((chat) => chat.id === "global");
  pushIfFound((chat) => chat.id === "general:study-help");

  if (user?.faculty) {
    pushIfFound((chat) => chat.group === "faculty" && chat.faculty === user.faculty);
  }

  if (user?.specialty) {
    pushIfFound((chat) => chat.group === "specialty" && chat.specialty === user.specialty);
  }

  if (result.length < limit) {
    appState.allChats.forEach((chat) => {
      if (result.length >= limit) return;
      if (!result.some((item) => item.id === chat.id)) {
        result.push(chat);
      }
    });
  }

  return result.slice(0, limit);
}

function getVisibleChats() {
  const search = appState.chatSearch.trim().toLowerCase();
  const favorites = new Set(getFavoriteRoomIds());

  let chats = appState.allChats;
  if (appState.activeChatFilter === "favorites") {
    chats = chats.filter((chat) => favorites.has(chat.id));
  }

  if (!search) return chats;

  return chats.filter((chat) => {
    const haystack = [chat.title, chat.subtitle, ...(chat.tags || []), chat.faculty, chat.specialty, chat.group]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

function renderRoomOptions() {
  if (!roomSelect) return;

  roomSelect.innerHTML = appState.allChats
    .map((chat) => `<option value="${escapeHtml(chat.id)}">${escapeHtml(chat.title)}</option>`)
    .join("");
}

function renderRecommendedChips() {
  if (!recommendedChatChips) return;

  const activeId = appState.activeRoomId;
  const chips = getRecommendedChats(5)
    .map((chat) => {
      const activeClass = chat.id === activeId ? " active" : "";
      return `<button class="suggestion-chip${activeClass}" type="button" data-open-room="${escapeHtml(chat.id)}">${escapeHtml(chat.title)}</button>`;
    })
    .join("");

  recommendedChatChips.innerHTML = chips;
}

function renderRoomList() {
  if (!roomList) return;

  const visibleChats = getVisibleChats();
  const favoriteIds = new Set(getFavoriteRoomIds());

  roomList.innerHTML = visibleChats
    .map((chat) => {
      const favoriteClass = favoriteIds.has(chat.id) ? " is-favorite" : "";
      const activeClass = chat.id === appState.activeRoomId ? " active" : "";
      const tags = (chat.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

      return `
        <button class="room-card${activeClass}" type="button" data-open-room="${escapeHtml(chat.id)}">
          <div class="room-card-head">
            <div>
              <strong>${escapeHtml(chat.title)}</strong>
              <div class="room-card-subtitle">${escapeHtml(chat.subtitle)}</div>
            </div>
            <button class="favorite-toggle-btn${favoriteClass}" type="button" data-favorite-room="${escapeHtml(chat.id)}">
              ${favoriteIds.has(chat.id) ? "★" : "☆"}
            </button>
          </div>
          <div class="room-card-tags">${tags}</div>
        </button>
      `;
    })
    .join("");

  if (emptyChatState) {
    emptyChatState.style.display = visibleChats.length ? "none" : "block";
  }
}

function renderDashboardRecommended() {
  if (!dashboardRecommendedChats) return;

  const cards = getRecommendedChats(4)
    .map((chat) => `
      <div class="recommendation-card">
        <div class="recommendation-card-head">
          <div>
            <strong>${escapeHtml(chat.title)}</strong>
            <div class="muted">${escapeHtml(chat.subtitle)}</div>
          </div>
          <button class="ghost-inline-btn" type="button" data-open-room="${escapeHtml(chat.id)}">Открыть</button>
        </div>
        <div>${(chat.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    `)
    .join("");

  dashboardRecommendedChats.innerHTML = cards || '<div class="empty-dashboard-state">Рекомендации появятся после загрузки каталога чатов.</div>';
}

function renderDashboardFavorites() {
  if (!dashboardFavoriteChats) return;

  const favorites = getFavoriteRoomIds()
    .map((roomId) => findChatById(roomId))
    .filter(Boolean);

  if (!favorites.length) {
    dashboardFavoriteChats.innerHTML = '<div class="empty-dashboard-state">Добавьте нужные комнаты в избранное. Например: ваш факультет, специальность и дом студентов.</div>';
    return;
  }

  dashboardFavoriteChats.innerHTML = favorites
    .slice(0, 6)
    .map((chat) => `
      <div class="favorite-preview-card">
        <div class="favorite-preview-head">
          <div>
            <strong>${escapeHtml(chat.title)}</strong>
            <div class="muted">${escapeHtml(chat.subtitle)}</div>
          </div>
          <button class="ghost-inline-btn" type="button" data-open-room="${escapeHtml(chat.id)}">Открыть</button>
        </div>
      </div>
    `)
    .join("");
}

function updateFavoriteCounters() {
  const count = getFavoriteRoomIds().length;

  if (favoriteCount) favoriteCount.textContent = String(count);
  if (dashboardFavoriteCount) dashboardFavoriteCount.textContent = String(count);
  if (totalChatsCount) totalChatsCount.textContent = String(appState.allChats.length);
}

function updateHeroContext() {
  const user = getCurrentUser();
  if (!heroPrimaryContext) return;

  const parts = [user?.faculty, user?.specialty, user?.course ? `${user.course} курс` : ""]
    .filter(Boolean)
    .join(" • ");

  heroPrimaryContext.textContent = parts || "Выберите факультет и специальность в профиле";
}

function updateFilterButtons() {
  const isFavorites = appState.activeChatFilter === "favorites";
  if (favoritesTabBtn) favoritesTabBtn.classList.toggle("active", isFavorites);
  if (allChatsTabBtn) allChatsTabBtn.classList.toggle("active", !isFavorites);
}

function updateFavoriteRoomButton() {
  if (!favoriteRoomBtn) return;

  const activeRoom = findChatById(appState.activeRoomId);
  const favorite = activeRoom ? isFavoriteRoom(activeRoom.id) : false;

  favoriteRoomBtn.classList.toggle("is-favorite", favorite);
  favoriteRoomBtn.textContent = favorite ? "★ В избранном" : "☆ В избранное";
}

function updateActiveRoomHeader() {
  const room = findChatById(appState.activeRoomId) || findChatById("global");
  if (!room) return;

  appState.activeRoomId = room.id;
  if (chatRoomTitle) chatRoomTitle.textContent = room.title;
  if (chatRoomSubtitle) chatRoomSubtitle.textContent = room.subtitle;
  if (roomSelect) roomSelect.value = room.id;

  if (chatRoomMeta) {
    chatRoomMeta.innerHTML = (room.tags || [])
      .map((tag) => `<span class="chat-meta-chip">${escapeHtml(tag)}</span>`)
      .join("");
  }

  updateFavoriteRoomButton();
}

function renderAllDynamicPanels() {
  renderRecommendedChips();
  renderRoomList();
  renderDashboardRecommended();
  renderDashboardFavorites();
  updateFavoriteCounters();
  updateHeroContext();
  updateFilterButtons();
  updateActiveRoomHeader();
}

function rebuildChatCatalog() {
  appState.allChats = buildChatCatalog();
  renderRoomOptions();

  const preferredRoomId = findChatById(getLastRoomId()) ? getLastRoomId() : "global";
  if (!findChatById(appState.activeRoomId)) {
    appState.activeRoomId = preferredRoomId;
  }

  renderAllDynamicPanels();
}

function setActiveRoom(roomId, emitJoin = true) {
  const room = findChatById(roomId) || findChatById("global");
  if (!room) return;

  appState.activeRoomId = room.id;
  saveLastRoomId(room.id);
  renderAllDynamicPanels();

  if (emitJoin) {
    socket.emit("join room", room.id);
  }
}

function switchSection(sectionName) {
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionName);
  });

  sections.forEach((section) => {
    section.classList.toggle("active", section.id === `section-${sectionName}`);
  });

  if (pageMeta[sectionName]) {
    pageTitle.textContent = pageMeta[sectionName].title;
    pageSubtitle.textContent = pageMeta[sectionName].subtitle;
  }

  if (sectionName === "chat") {
    renderAllDynamicPanels();
  }

  closeSidebar();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  if (themeToggle) themeToggle.textContent = isDark ? "☀️" : "🌙";
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
      localStorage.setItem("theme", nextTheme);
      applyTheme(nextTheme);
    });
  }
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function applyUserProfileToUI(user) {
  if (!user) return;

  const derived = parseKaznuNameFromEmail(user.email);
  const displayName = buildDisplayName(user);
  const realName = `${derived.firstName || "-"} ${derived.lastName || "-"}`.trim();

  if (sidebarAvatar) sidebarAvatar.textContent = getInitials(displayName);
  if (sidebarName) sidebarName.textContent = displayName;
  if (sidebarEmail) sidebarEmail.textContent = user.email || "Почта не указана";
  if (sidebarFaculty) sidebarFaculty.textContent = `Факультет: ${user.faculty || "Не указан"}`;
  if (sidebarSpecialty) sidebarSpecialty.textContent = `Специальность: ${user.specialty || "Не указана"}`;
  if (sidebarCourse) sidebarCourse.textContent = `Курс: ${user.course || "Не указан"}`;
  if (sidebarDerivedName) sidebarDerivedName.textContent = `Настоящее имя: ${realName}`;

  setTooltip(sidebarName, displayName);
  setTooltip(sidebarEmail, user.email || "");
  setTooltip(sidebarFaculty, sidebarFaculty?.textContent || "");
  setTooltip(sidebarSpecialty, sidebarSpecialty?.textContent || "");
  setTooltip(sidebarCourse, sidebarCourse?.textContent || "");
  setTooltip(sidebarDerivedName, sidebarDerivedName?.textContent || "");

  if (topbarRole) {
    topbarRole.textContent = user.role === "admin" ? "Администратор" : "Студент";
  }

  if (usernameInput) usernameInput.value = displayName;
  if (editDisplayName) editDisplayName.value = user.displayName || "";
  if (editEmail) editEmail.value = user.email || "";
  if (editFaculty) editFaculty.value = user.faculty || "";
  if (editSpecialty) editSpecialty.value = user.specialty || "";
  if (editCourse) editCourse.value = user.course ? `${user.course} курс` : "";
  if (editRealName) editRealName.value = realName;
  if (editBio) editBio.value = user.bio || "";

  renderAllDynamicPanels();
}

function renderEvents(items) {
  if (!eventsList) return;

  eventsList.innerHTML = "";
  if (eventsCount) eventsCount.textContent = String(items.length);

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="muted card-spacer">${escapeHtml(item.description)}</div>
      <div class="muted card-spacer"><strong>${escapeHtml(item.date)}</strong> • ${escapeHtml(item.place)}</div>
      <div class="muted card-spacer">${escapeHtml(item.faculty || "Все факультеты")}</div>
      <div>${(item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    `;
    eventsList.appendChild(div);
  });
}

function renderAnnouncements(items) {
  if (!announcementsList) return;

  announcementsList.innerHTML = "";
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="muted card-spacer">${escapeHtml(item.text)}</div>
      <div class="tag">${escapeHtml(item.meta)}</div>
    `;
    announcementsList.appendChild(div);
  });
}

function renderCards(container, items, cardClass) {
  if (!container) return;

  container.innerHTML = "";
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = cardClass;
    div.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="muted">${escapeHtml(item.text)}</div>
      ${item.tags ? `<div>${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
    `;
    container.appendChild(div);
  });
}

function renderFaculties() {
  const items = Object.keys(FACULTIES).length
    ? Object.keys(FACULTIES)
        .sort((left, right) => left.localeCompare(right, "ru"))
        .map((facultyName) => ({
          title: facultyName,
          text: `${FACULTIES[facultyName].length} специальностей доступны в каталоге чатов.`,
          tags: ["Факультет", `${FACULTIES[facultyName].length} чатов по направлениям`]
        }))
    : fallbackFacultiesData;

  renderCards(facultiesList, items, "faculty-card");
}

function renderStudents() {
  renderCards(studentsList, studentsData, "student-card");
}

function addMessage(message) {
  if (!messagesDiv) return;

  const currentUser = getCurrentUser();
  const myName = buildDisplayName(currentUser);

  const messageEl = document.createElement("div");
  messageEl.className = "message";

  if (myName && message.username === myName) {
    messageEl.classList.add("own");
  }

  const deleteButton = currentUser && currentUser.role === "admin" && message._id
    ? `<button class="delete-message-btn" data-id="${escapeHtml(message._id)}" type="button">Удалить</button>`
    : "";

  messageEl.innerHTML = `
    <div class="meta">
      <strong>${escapeHtml(message.username)}</strong> • ${escapeHtml(message.time)}
      ${deleteButton}
    </div>
    <div class="text">${escapeHtml(message.text)}</div>
  `;

  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadEvents() {
  try {
    const res = await fetch("/api/events");
    const data = await res.json();
    renderEvents(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Ошибка загрузки мероприятий:", err);
    renderEvents([]);
  }
}

async function loadAnnouncements() {
  try {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    renderAnnouncements(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Ошибка загрузки объявлений:", err);
    renderAnnouncements([]);
  }
}

async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();
    const statCards = document.querySelectorAll(".stat-card .value");

    if (statCards[0]) statCards[0].textContent = data.totalUsers ?? 0;
    if (statCards[1]) statCards[1].textContent = data.onlineUsers ?? 0;
    if (statCards[2]) statCards[2].textContent = data.totalEvents ?? 0;
  } catch (err) {
    console.error("Ошибка загрузки статистики:", err);
  }
}

async function loadFaculties() {
  try {
    const res = await fetch("/api/faculties");
    FACULTIES = await res.json();
  } catch (err) {
    console.error("Ошибка загрузки факультетов:", err);
    FACULTIES = {};
  }
}

function loadFacultyOptionsAuth() {
  const regFaculty = $("regFaculty");
  if (!regFaculty) return;

  regFaculty.innerHTML = '<option value="">Выберите факультет</option>';
  Object.keys(FACULTIES).forEach((faculty) => {
    const option = document.createElement("option");
    option.value = faculty;
    option.textContent = faculty;
    regFaculty.appendChild(option);
  });
}

function loadSpecialtyOptionsAuth(facultyName) {
  const regSpecialty = $("regSpecialty");
  if (!regSpecialty) return;

  regSpecialty.innerHTML = "";

  if (!facultyName || !FACULTIES[facultyName]) {
    regSpecialty.innerHTML = '<option value="">Сначала выберите факультет</option>';
    return;
  }

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = "Выберите специальность";
  regSpecialty.appendChild(firstOption);

  FACULTIES[facultyName].forEach((specialty) => {
    const option = document.createElement("option");
    option.value = specialty;
    option.textContent = specialty;
    regSpecialty.appendChild(option);
  });
}

async function sendPresencePing() {
  const currentUser = getCurrentUser();
  if (!currentUser?.email) return;

  try {
    await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentUser.email })
    });
  } catch (err) {
    console.error("Ошибка presence ping:", err);
  }
}

function stopPresenceHeartbeat() {
  if (presenceIntervalId) {
    clearInterval(presenceIntervalId);
    presenceIntervalId = null;
  }
}

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  sendPresencePing();
  presenceIntervalId = window.setInterval(async () => {
    await sendPresencePing();
    await loadStats();
  }, 60000);
}

async function validateCurrentUser() {
  const user = getCurrentUser();
  if (!user || !user.email) return null;

  try {
    const res = await fetch("/api/validate-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email })
    });

    if (!res.ok) {
      clearCurrentUser();
      return null;
    }

    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error("Ошибка валидации пользователя:", err);
    return null;
  }
}

async function applyAccess() {
  let user = getCurrentUser();

  if (user) {
    const validatedUser = await validateCurrentUser();
    if (validatedUser) {
      user = validatedUser;
      saveCurrentUser(user);
    } else {
      user = null;
    }
  }

  if (!user) {
    stopPresenceHeartbeat();
    if (authScreen) authScreen.style.display = "flex";
    if (appShell) appShell.style.display = "none";
    closeSidebar();
    return;
  }

  if (authScreen) authScreen.style.display = "none";
  if (appShell) appShell.style.display = "block";

  document.querySelectorAll(".admin-only").forEach((block) => {
    block.style.display = user.role === "admin" ? "" : "none";
  });

  applyUserProfileToUI(user);
  rebuildChatCatalog();
  setActiveRoom(findChatById(getLastRoomId()) ? getLastRoomId() : "global");
  startPresenceHeartbeat();
}

function sendMessage() {
  const currentUser = getCurrentUser();
  const text = messageInput?.value.trim();

  if (!currentUser) {
    alert("Сначала войди в аккаунт");
    return;
  }

  if (!text) return;

  socket.emit("chat message", {
    username: buildDisplayName(currentUser),
    text,
    room: appState.activeRoomId,
    userEmail: currentUser.email
  });

  messageInput.value = "";
  messageInput.focus();
}

async function handleProfileSave() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Сначала войди в аккаунт");
    return;
  }

  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentUser.email,
        displayName: editDisplayName.value.trim(),
        bio: editBio.value.trim()
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Не удалось обновить профиль");
      return;
    }

    saveCurrentUser(data.user);
    applyUserProfileToUI(data.user);
    rebuildChatCatalog();
    alert("Профиль обновлён");
  } catch (err) {
    console.error("Ошибка обновления профиля:", err);
    alert("Ошибка сервера");
  }
}

async function handleAddEvent() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    alert("Нет доступа");
    return;
  }

  const payload = {
    title: eventTitle.value.trim(),
    description: eventDescription.value.trim(),
    date: eventDate.value.trim(),
    place: eventPlace.value.trim(),
    faculty: eventFaculty.value.trim(),
    tags: eventTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
    adminEmail: currentUser.email
  };

  if (!payload.title || !payload.description || !payload.date || !payload.place) {
    alert("Заполни название, описание, дату и место");
    return;
  }

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Не удалось добавить мероприятие");
      return;
    }

    eventTitle.value = "";
    eventDescription.value = "";
    eventDate.value = "";
    eventPlace.value = "";
    eventFaculty.value = "";
    eventTags.value = "";

    await loadEvents();
    await loadStats();
    alert("Мероприятие добавлено");
  } catch (err) {
    console.error("Ошибка добавления мероприятия:", err);
    alert("Ошибка сервера");
  }
}

async function handleAddAnnouncement() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    alert("Нет доступа");
    return;
  }

  const payload = {
    title: announcementTitle.value.trim(),
    text: announcementText.value.trim(),
    meta: announcementMeta.value.trim(),
    adminEmail: currentUser.email
  };

  if (!payload.title || !payload.text || !payload.meta) {
    alert("Заполни заголовок, текст и meta");
    return;
  }

  try {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Не удалось добавить объявление");
      return;
    }

    announcementTitle.value = "";
    announcementText.value = "";
    announcementMeta.value = "";

    await loadAnnouncements();
    alert("Объявление добавлено");
  } catch (err) {
    console.error("Ошибка добавления объявления:", err);
    alert("Ошибка сервера");
  }
}

async function handleMakeAdmin() {
  const currentUser = getCurrentUser();
  const targetEmail = newAdminEmail.value.trim().toLowerCase();

  if (!currentUser || currentUser.role !== "admin") {
    alert("Нет доступа");
    return;
  }

  if (!targetEmail) {
    alert("Введи почту пользователя");
    return;
  }

  try {
    const res = await fetch("/api/admin/make-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail: currentUser.email,
        targetEmail
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Ошибка назначения админа");
      return;
    }

    newAdminEmail.value = "";
    alert("Пользователь стал админом");
  } catch (err) {
    console.error("Ошибка назначения админа:", err);
    alert("Ошибка сервера");
  }
}

function bindRealtime() {
  socket.on("chat history", (messages) => {
    if (!messagesDiv) return;
    messagesDiv.innerHTML = "";
    messages.forEach(addMessage);
  });

  socket.on("chat message", (message) => {
    addMessage(message);
  });
}

function openRoomAndChat(roomId) {
  switchSection("chat");
  setActiveRoom(roomId);
}

function bindStaticUI() {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchSection(btn.dataset.section);
    });
  });

  if (roomList) {
    roomList.addEventListener("click", (event) => {
      const favoriteBtn = event.target.closest("[data-favorite-room]");
      if (favoriteBtn) {
        event.stopPropagation();
        toggleFavoriteRoom(favoriteBtn.dataset.favoriteRoom);
        return;
      }

      const roomBtn = event.target.closest("[data-open-room]");
      if (roomBtn) {
        setActiveRoom(roomBtn.dataset.openRoom);
      }
    });
  }

  if (recommendedChatChips) {
    recommendedChatChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-open-room]");
      if (button) {
        setActiveRoom(button.dataset.openRoom);
      }
    });
  }

  [dashboardRecommendedChats, dashboardFavoriteChats].forEach((container) => {
    if (!container) return;
    container.addEventListener("click", (event) => {
      const button = event.target.closest("[data-open-room]");
      if (button) {
        openRoomAndChat(button.dataset.openRoom);
      }
    });
  });

  if (favoriteRoomBtn) {
    favoriteRoomBtn.addEventListener("click", () => {
      toggleFavoriteRoom(appState.activeRoomId);
    });
  }

  if (favoritesTabBtn) {
    favoritesTabBtn.addEventListener("click", () => {
      appState.activeChatFilter = "favorites";
      renderAllDynamicPanels();
    });
  }

  if (allChatsTabBtn) {
    allChatsTabBtn.addEventListener("click", () => {
      appState.activeChatFilter = "all";
      renderAllDynamicPanels();
    });
  }

  if (chatSearchInput) {
    chatSearchInput.addEventListener("input", () => {
      appState.chatSearch = chatSearchInput.value || "";
      renderRoomList();
    });
  }

  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (messageInput) {
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        sendMessage();
      }
    });
  }

  if (saveProfileEditBtn) saveProfileEditBtn.addEventListener("click", handleProfileSave);
  if (addEventBtn) addEventBtn.addEventListener("click", handleAddEvent);
  if (addAnnouncementBtn) addAnnouncementBtn.addEventListener("click", handleAddAnnouncement);
  if (makeAdminBtn) makeAdminBtn.addEventListener("click", handleMakeAdmin);
  if (openProfileBtn) openProfileBtn.addEventListener("click", () => switchSection("profile"));
  if (goToChatBtn) goToChatBtn.addEventListener("click", () => switchSection("chat"));
  if (heroOpenChatsBtn) heroOpenChatsBtn.addEventListener("click", () => switchSection("chat"));
  if (dashboardBrowseChatsBtn) dashboardBrowseChatsBtn.addEventListener("click", () => switchSection("chat"));
  if (heroOpenProfileBtn) heroOpenProfileBtn.addEventListener("click", () => switchSection("profile"));

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      stopPresenceHeartbeat();
      clearCurrentUser();
      if (authScreen) authScreen.style.display = "flex";
      if (appShell) appShell.style.display = "none";
      switchSection("dashboard");
      closeSidebar();
    });
  }

  if (sidebarToggle) sidebarToggle.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-message-btn");
    if (!btn) return;

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      alert("Нет доступа");
      return;
    }

    try {
      const res = await fetch(`/api/messages/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: currentUser.email })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не удалось удалить сообщение");
        return;
      }

      btn.closest(".message")?.remove();
    } catch (err) {
      console.error(err);
      alert("Ошибка сервера");
    }
  });

  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden && getCurrentUser()) {
      await sendPresencePing();
      await loadStats();
    }
  });

  window.addEventListener("focus", async () => {
    if (getCurrentUser()) {
      await sendPresencePing();
      await loadStats();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeSidebar();
    }
  });
}

async function initAuthFlow() {
  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  const verifyForm = $("verifyForm");

  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginBtn = $("loginBtn");

  const regNickname = $("regNickname");
  const regEmail = $("regEmail");
  const regPassword = $("regPassword");
  const regFaculty = $("regFaculty");
  const regSpecialty = $("regSpecialty");
  const regCourse = $("regCourse");
  const registerBtn = $("registerBtn");

  const verifyEmail = $("verifyEmail");
  const verifyCode = $("verifyCode");
  const verifyBtn = $("verifyBtn");

  const goToRegister = $("goToRegister");
  const goToLogin = $("goToLogin");
  const backToLoginFromVerify = $("backToLoginFromVerify");

  function showLoginForm() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    verifyForm.style.display = "none";
  }

  function showRegisterForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    verifyForm.style.display = "none";
  }

  function showVerifyForm() {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    verifyForm.style.display = "block";
  }

  if (goToRegister) goToRegister.addEventListener("click", showRegisterForm);
  if (goToLogin) goToLogin.addEventListener("click", showLoginForm);
  if (backToLoginFromVerify) backToLoginFromVerify.addEventListener("click", showLoginForm);
  if (regFaculty) {
    regFaculty.addEventListener("change", () => {
      loadSpecialtyOptionsAuth(regFaculty.value);
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
      const payload = {
        nickname: regNickname.value.trim(),
        email: regEmail.value.trim().toLowerCase(),
        password: regPassword.value.trim(),
        faculty: regFaculty.value,
        specialty: regSpecialty.value,
        course: regCourse.value
      };

      if (!payload.nickname || !payload.email || !payload.password || !payload.faculty || !payload.specialty || !payload.course) {
        alert("Заполни все поля");
        return;
      }

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Ошибка регистрации");
          return;
        }

        verifyEmail.value = payload.email;
        verifyCode.value = "";
        alert("Код отправлен на почту. Подтверди аккаунт.");
        showVerifyForm();
      } catch (err) {
        console.error(err);
        alert("Ошибка сервера");
      }
    });
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
      const email = verifyEmail.value.trim().toLowerCase();
      const code = verifyCode.value.trim();

      if (!email || !code) {
        alert("Введи почту и код");
        return;
      }

      try {
        const res = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Ошибка подтверждения");
          return;
        }

        alert("Почта подтверждена. Теперь войди в аккаунт.");
        loginEmail.value = email;
        loginPassword.value = "";
        verifyCode.value = "";
        showLoginForm();
      } catch (err) {
        console.error(err);
        alert("Ошибка сервера");
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = loginEmail.value.trim().toLowerCase();
      const password = loginPassword.value.trim();

      if (!email || !password) {
        alert("Введи почту и пароль");
        return;
      }

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Ошибка входа");
          return;
        }

        saveCurrentUser(data.user);
        await applyAccess();
        await sendPresencePing();
        await loadStats();
        switchSection("dashboard");
      } catch (err) {
        console.error(err);
        alert("Ошибка сервера");
      }
    });
  }

  if (!getCurrentUser()) {
    showLoginForm();
  }
}

async function initApp() {
  initTheme();
  bindStaticUI();
  bindRealtime();
  renderStudents();

  await loadFaculties();
  renderFaculties();
  rebuildChatCatalog();
  loadFacultyOptionsAuth();
  loadSpecialtyOptionsAuth($("regFaculty")?.value || "");

  await Promise.all([loadEvents(), loadAnnouncements(), loadStats()]);
  await initAuthFlow();
  await applyAccess();

  if (!getCurrentUser()) {
    setActiveRoom("global");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initApp().catch((err) => {
    console.error("Ошибка инициализации приложения:", err);
  });
});
