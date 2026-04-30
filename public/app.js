function $(id) {
  return document.getElementById(id);
}

const socket = io();

let FACULTIES = {};
let presenceIntervalId = null;

const translations = {
  en: {
    "auth.badge": "KazNU Student Platform",
    "auth.lead": "One place for campus chat, announcements, events, and student networking.",
    "auth.emailLabel": "Student email",
    "auth.emailPlaceholder": "student@live.kaznu.kz",
    "auth.passwordLabel": "Password",
    "auth.passwordPlaceholder": "Minimum 6 characters",
    "auth.signIn": "Sign in",
    "nav.dashboard": "Home",
    "nav.chat": "Chats",
    "nav.ai": "AI Chat",
    "nav.announcements": "Announcements",
    "nav.events": "Events",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "sidebar.online": "online",
    "sidebar.menu": "Main menu",
    "dashboard.heroSubtitle": "A university workspace for conversations, coordination, and fast student updates.",
    "dashboard.openChats": "Open chats",
    "dashboard.openProfile": "Open profile",
    "dashboard.profileLabel": "Profile",
    "dashboard.favoritesLabel": "Favorites",
    "dashboard.roomsCount": "Rooms in catalog",
    "dashboard.eventsCount": "Events",
    "dashboard.verifiedStudents": "Verified students",
    "dashboard.onlineNow": "Online now",
    "dashboard.storageMode": "Storage mode",
    "dashboard.recommendedRooms": "Recommended rooms",
    "dashboard.recommendedHint": "Quick access to the most useful chats for your faculty and course.",
    "dashboard.openCatalog": "Open catalog",
    "dashboard.favoriteRooms": "Favorite rooms",
    "dashboard.favoriteHint": "Pin the chats you need most and come back to them in one click.",
    "chat.catalogTitle": "Chat catalog",
    "chat.catalogCaption": "Faculties, specialties, dormitories, and shared rooms",
    "chat.searchPlaceholder": "Search chats",
    "chat.favoritesTab": "Favorites",
    "chat.allTab": "All chats",
    "chat.usernamePlaceholder": "Your name",
    "chat.messagePlaceholder": "Write a message...",
    "chat.send": "Send",
    "chat.emptyState": "No chats matched your search. Try a different query or switch to All chats.",
    "chat.favoriteAdd": "☆ Add to favorites",
    "chat.favoriteSaved": "★ In favorites",
    "chat.generalTitle": "General chat",
    "chat.generalSubtitle": "A shared room for all KazNU students",
    "announcements.title": "Announcements",
    "announcements.subtitle": "A short feed of important academic and campus updates.",
    "events.title": "Events",
    "events.subtitle": "Meetups, lectures, and activities you can quickly add to your plan.",
    "profile.title": "Profile",
    "profile.subtitle": "Manage your public name and short bio without changing verified account data.",
    "profile.myData": "My details",
    "profile.displayName": "Display name",
    "profile.displayNamePlaceholder": "Nickname",
    "profile.email": "Email",
    "profile.faculty": "Faculty",
    "profile.specialty": "Specialty",
    "profile.course": "Course",
    "profile.realName": "Legal name",
    "profile.about": "About",
    "profile.aboutPlaceholder": "What are you interested in, which projects are you part of, and how can you help other students?",
    "profile.save": "Save changes",
    "admin.title": "Admin panel",
    "admin.subtitle": "Manage roles, events, and announcements.",
    "admin.assignAdmin": "Assign admin role",
    "admin.userEmail": "User email",
    "admin.promote": "Promote to admin",
    "admin.addEvent": "Add event",
    "admin.titleField": "Title",
    "admin.descriptionField": "Description",
    "admin.dateField": "Date and time",
    "admin.placeField": "Place",
    "admin.facultyField": "Faculty",
    "admin.tagsField": "Tags",
    "admin.tagsPlaceholder": "Comma-separated tags",
    "admin.addEventButton": "Add event",
    "admin.addAnnouncement": "Add announcement",
    "admin.headlineField": "Headline",
    "admin.textField": "Text",
    "admin.metaPlaceholder": "For example: Faculty • Today",
    "admin.addAnnouncementButton": "Add announcement",
    "ai.title": "AI Chat",
    "ai.subtitle": "Our KazNU knowledge assistant, available directly inside the platform.",
    "ai.eyebrow": "KazNU Knowledge Assistant",
    "ai.heading": "Ask our AI assistant",
    "ai.body": "The assistant searches KazNU public sources and answers questions about faculties, admissions, services, and campus information.",
    "ai.openAssistant": "Open AI workspace",
    "ai.openDocs": "Open API docs",
    "ai.loading": "Connecting to the AI workspace...",
    "ai.ready": "AI assistant connected. You can use it below or open it in a separate tab.",
    "app.roleStudent": "Student",
    "app.roleAdmin": "Administrator",
    "app.anonymous": "Anonymous",
    "app.emailMissing": "Email not provided",
    "app.notSelected": "not selected",
    "app.unavailable": "unavailable",
    "app.storageLocal": "Local mode",
    "app.storageActive": "Service online",
    "app.storageUnknown": "Status unknown",
    "app.storageLocalShort": "Local",
    "app.storageOnline": "Online",
    "app.heroFallback": "Complete your profile to see relevant rooms here",
    "app.recommendationsEmpty": "Recommendations will appear after the chat catalog loads.",
    "app.favoritesEmpty": "Add a few rooms to favorites for faster access.",
    "app.eventsEmpty": "No events have been published yet. New campus events will appear here.",
    "app.announcementsEmpty": "No announcements are active yet. Important university updates will appear here.",
    "app.facultyTag": "Faculty",
    "app.specialtyTag": "Specialty",
    "app.dormTag": "Dormitory",
    "app.courseSuffix": "year",
    "app.allFaculties": "All faculties",
    "app.open": "Open",
    "app.delete": "Delete",
    "toast.signInRequired": "Sign in to continue.",
    "toast.profileUpdated": "Profile updated",
    "toast.serverError": "Server error",
    "toast.accessDenied": "Access denied",
    "toast.fillEvent": "Fill in title, description, date, and place.",
    "toast.fillAnnouncement": "Fill in headline, text, and meta.",
    "toast.adminGranted": "User promoted to admin",
    "toast.eventAdded": "Event added",
    "toast.announcementAdded": "Announcement added",
    "toast.messageDeleted": "Message deleted",
    "toast.loginRequired": "Enter both email and password.",
    "toast.welcome": "Welcome back, {name}.",
    "page.dashboard.title": "Home",
    "page.chat.title": "Chats",
    "page.chat.subtitle": "Private, faculty, and campus-wide rooms",
    "page.ai.title": "AI Chat",
    "page.ai.subtitle": "The KazNU assistant workspace embedded inside the main platform",
    "page.announcements.title": "Announcements",
    "page.announcements.subtitle": "A short feed of the latest important updates",
    "page.events.title": "Events",
    "page.events.subtitle": "Upcoming campus activities and academic events",
    "page.profile.title": "Profile",
    "page.profile.subtitle": "Core account information and public identity settings",
    "page.admin.title": "Admin panel",
    "page.admin.subtitle": "Manage events, announcements, and platform access"
  },
  ru: {
    "auth.badge": "Студенческая платформа КазНУ",
    "auth.lead": "Единое пространство для чатов, объявлений, событий кампуса и студенческого нетворкинга.",
    "auth.emailLabel": "Студенческая почта",
    "auth.emailPlaceholder": "student@live.kaznu.kz",
    "auth.passwordLabel": "Пароль",
    "auth.passwordPlaceholder": "Минимум 6 символов",
    "auth.signIn": "Войти",
    "nav.dashboard": "Главная",
    "nav.chat": "Чаты",
    "nav.ai": "AI-чат",
    "nav.announcements": "Объявления",
    "nav.events": "События",
    "nav.profile": "Профиль",
    "nav.admin": "Админ",
    "sidebar.online": "онлайн",
    "sidebar.menu": "Главное меню",
    "dashboard.heroSubtitle": "Университетское пространство для общения, координации и быстрых студенческих обновлений.",
    "dashboard.openChats": "Перейти в чаты",
    "dashboard.openProfile": "Открыть профиль",
    "dashboard.profileLabel": "Профиль",
    "dashboard.favoritesLabel": "Избранное",
    "dashboard.roomsCount": "Комнат в каталоге",
    "dashboard.eventsCount": "События",
    "dashboard.verifiedStudents": "Подтверждённые студенты",
    "dashboard.onlineNow": "Сейчас онлайн",
    "dashboard.storageMode": "Режим хранения",
    "dashboard.recommendedRooms": "Рекомендуемые комнаты",
    "dashboard.recommendedHint": "Быстрый вход в самые полезные чаты для вашего факультета и курса.",
    "dashboard.openCatalog": "Открыть каталог",
    "dashboard.favoriteRooms": "Избранные комнаты",
    "dashboard.favoriteHint": "Закрепите нужные чаты, чтобы возвращаться к ним в один клик.",
    "chat.catalogTitle": "Каталог чатов",
    "chat.catalogCaption": "Факультеты, специальности, общежития и общие комнаты",
    "chat.searchPlaceholder": "Поиск по чатам",
    "chat.favoritesTab": "Избранные",
    "chat.allTab": "Все чаты",
    "chat.usernamePlaceholder": "Ваше имя",
    "chat.messagePlaceholder": "Введите сообщение...",
    "chat.send": "Отправить",
    "chat.emptyState": "Чаты не найдены. Попробуйте изменить поиск или откройте вкладку «Все чаты».",
    "chat.favoriteAdd": "☆ В избранное",
    "chat.favoriteSaved": "★ В избранном",
    "chat.generalTitle": "Общий чат",
    "chat.generalSubtitle": "Обсуждение для всех студентов КазНУ",
    "announcements.title": "Объявления",
    "announcements.subtitle": "Короткая лента важных академических и кампусных обновлений.",
    "events.title": "Мероприятия",
    "events.subtitle": "Встречи, лекции и активности, которые можно быстро добавить в личный план.",
    "profile.title": "Профиль",
    "profile.subtitle": "Управляйте публичным именем и кратким описанием, не меняя данные верификации.",
    "profile.myData": "Мои данные",
    "profile.displayName": "Отображаемое имя",
    "profile.displayNamePlaceholder": "Никнейм",
    "profile.email": "Почта",
    "profile.faculty": "Факультет",
    "profile.specialty": "Специальность",
    "profile.course": "Курс",
    "profile.realName": "Настоящее имя",
    "profile.about": "О себе",
    "profile.aboutPlaceholder": "Чем вы интересуетесь, в каких проектах участвуете и чем можете быть полезны другим студентам?",
    "profile.save": "Сохранить изменения",
    "admin.title": "Админ-панель",
    "admin.subtitle": "Управление ролями, мероприятиями и объявлениями.",
    "admin.assignAdmin": "Назначить админа",
    "admin.userEmail": "Почта пользователя",
    "admin.promote": "Сделать админом",
    "admin.addEvent": "Добавить мероприятие",
    "admin.titleField": "Название",
    "admin.descriptionField": "Описание",
    "admin.dateField": "Дата и время",
    "admin.placeField": "Место",
    "admin.facultyField": "Факультет",
    "admin.tagsField": "Теги",
    "admin.tagsPlaceholder": "Теги через запятую",
    "admin.addEventButton": "Добавить событие",
    "admin.addAnnouncement": "Добавить объявление",
    "admin.headlineField": "Заголовок",
    "admin.textField": "Текст",
    "admin.metaPlaceholder": "Например: ФМО • Сегодня",
    "admin.addAnnouncementButton": "Добавить объявление",
    "ai.title": "AI-чат",
    "ai.subtitle": "Наш помощник по базе знаний КазНУ прямо внутри платформы.",
    "ai.eyebrow": "Ассистент знаний КазНУ",
    "ai.heading": "Спроси нашего AI-ассистента",
    "ai.body": "Ассистент ищет по публичным источникам КазНУ и отвечает на вопросы о факультетах, поступлении, сервисах и жизни кампуса.",
    "ai.openAssistant": "Открыть AI-пространство",
    "ai.openDocs": "Открыть API Docs",
    "ai.loading": "Подключаем AI-раздел...",
    "ai.ready": "AI-ассистент подключён. Можно работать ниже или открыть его в отдельной вкладке.",
    "app.roleStudent": "Студент",
    "app.roleAdmin": "Администратор",
    "app.anonymous": "Аноним",
    "app.emailMissing": "Почта не указана",
    "app.notSelected": "не указан",
    "app.unavailable": "недоступно",
    "app.storageLocal": "Локальный режим",
    "app.storageActive": "Сервис активен",
    "app.storageUnknown": "Статус неизвестен",
    "app.storageLocalShort": "Локально",
    "app.storageOnline": "Онлайн",
    "app.heroFallback": "Заполните профиль, чтобы видеть релевантные комнаты",
    "app.recommendationsEmpty": "Рекомендации появятся после загрузки каталога чатов.",
    "app.favoritesEmpty": "Добавьте несколько комнат в избранное для быстрого доступа.",
    "app.eventsEmpty": "Пока нет опубликованных мероприятий. Когда появятся новые события кампуса, они будут видны здесь.",
    "app.announcementsEmpty": "Пока нет активных объявлений. Здесь будут собираться важные университетские обновления.",
    "app.facultyTag": "Факультет",
    "app.specialtyTag": "Специальность",
    "app.dormTag": "Общежитие",
    "app.courseSuffix": "курс",
    "app.allFaculties": "Все факультеты",
    "app.open": "Открыть",
    "app.delete": "Удалить",
    "toast.signInRequired": "Сначала войдите в аккаунт.",
    "toast.profileUpdated": "Профиль обновлён",
    "toast.serverError": "Ошибка сервера",
    "toast.accessDenied": "Нет доступа",
    "toast.fillEvent": "Заполните название, описание, дату и место.",
    "toast.fillAnnouncement": "Заполните заголовок, текст и meta.",
    "toast.adminGranted": "Пользователь стал админом",
    "toast.eventAdded": "Мероприятие добавлено",
    "toast.announcementAdded": "Объявление добавлено",
    "toast.messageDeleted": "Сообщение удалено",
    "toast.loginRequired": "Введите и почту, и пароль.",
    "toast.welcome": "С возвращением, {name}.",
    "page.dashboard.title": "Главная",
    "page.chat.title": "Чаты",
    "page.chat.subtitle": "Личные, факультетские и общие комнаты",
    "page.ai.title": "AI-чат",
    "page.ai.subtitle": "Пространство ассистента КазНУ внутри основной платформы",
    "page.announcements.title": "Объявления",
    "page.announcements.subtitle": "Короткая лента важных обновлений",
    "page.events.title": "События",
    "page.events.subtitle": "Ближайшие встречи и активности кампуса",
    "page.profile.title": "Профиль",
    "page.profile.subtitle": "Основные данные аккаунта и публичные настройки",
    "page.admin.title": "Админ-панель",
    "page.admin.subtitle": "Управление событиями, объявлениями и доступом"
  }
};

let currentLanguage = localStorage.getItem("language") || "en";

function t(key, replacements = {}) {
  let value = translations[currentLanguage]?.[key] ?? translations.en[key] ?? key;
  Object.entries(replacements).forEach(([token, replacement]) => {
    value = value.replaceAll(`{${token}}`, String(replacement));
  });
  return value;
}

function getPageMeta() {
  return {
    dashboard: { title: t("page.dashboard.title"), subtitle: "" },
    chat: { title: t("page.chat.title"), subtitle: t("page.chat.subtitle") },
    ai: { title: t("page.ai.title"), subtitle: t("page.ai.subtitle") },
    announcements: { title: t("page.announcements.title"), subtitle: t("page.announcements.subtitle") },
    events: { title: t("page.events.title"), subtitle: t("page.events.subtitle") },
    profile: { title: t("page.profile.title"), subtitle: t("page.profile.subtitle") },
    admin: { title: t("page.admin.title"), subtitle: t("page.admin.subtitle") }
  };
}

function getFallbackFacultiesData() {
  return [
    { title: "ФМО", text: currentLanguage === "ru" ? "Международные отношения и аналитика." : "International relations and analytical studies.", tags: ["ФМО", currentLanguage === "ru" ? "Сообщество" : "Community", currentLanguage === "ru" ? "Чаты" : "Chats"] },
    { title: "Юрфак", text: currentLanguage === "ru" ? "Право, исследования и учебные проекты." : "Law, research, and academic projects.", tags: [currentLanguage === "ru" ? "Право" : "Law", currentLanguage === "ru" ? "Студенты" : "Students", currentLanguage === "ru" ? "Исследования" : "Research"] },
    { title: "IT / CS", text: currentLanguage === "ru" ? "Код, AI и командные проекты." : "Code, AI, and team-based projects.", tags: [currentLanguage === "ru" ? "Код" : "Code", "AI", currentLanguage === "ru" ? "Разработка" : "Development"] },
    { title: "Экономика", text: currentLanguage === "ru" ? "Финансы, аналитика и карьерные события." : "Finance, analytics, and career-focused events.", tags: [currentLanguage === "ru" ? "Экономика" : "Economics", currentLanguage === "ru" ? "Карьера" : "Career", currentLanguage === "ru" ? "Финансы" : "Finance"] }
  ];
}

function getStudentsData() {
  return [
    { title: "Алихан Серик", text: currentLanguage === "ru" ? "ФМО • 1 курс • интересы: право, дебаты, международные проекты" : "International Relations • Year 1 • interests: law, debate, international projects" },
    { title: "Dana K.", text: currentLanguage === "ru" ? "IT / CS • 2 курс • интересы: frontend, backend, AI" : "IT / CS • Year 2 • interests: frontend, backend, AI" },
    { title: "Aruzhan M.", text: currentLanguage === "ru" ? "Экономика • 3 курс • интересы: аналитика, кейсы, клубы" : "Economics • Year 3 • interests: analytics, case studies, clubs" },
    { title: "Nursultan A.", text: currentLanguage === "ru" ? "Юрфак • 2 курс • интересы: research, law, moot court" : "Law • Year 2 • interests: research, law, moot court" }
  ];
}

const appState = {
  allChats: [],
  activeRoomId: "global",
  activeChatFilter: "favorites",
  chatSearch: "",
  activeSection: "dashboard"
};

const uiState = {
  storageMode: "unknown"
};

const runtimeConfig = {
  aiAssistantUrl: "",
  aiAssistantDocsUrl: ""
};

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const sections = Array.from(document.querySelectorAll(".section"));

const authScreen = $("authScreen");
const toastRegion = $("toastRegion");
const appShell = $("appShell");
const appSidebar = $("appSidebar");
const sidebarOverlay = $("sidebarOverlay");
const sidebarToggle = $("sidebarToggle");
const sidebarClose = $("sidebarClose");
const themeToggle = $("themeToggle");
const languageToggle = $("languageToggle");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");
const topbarRole = $("topbarRole");
const platformStatusChip = $("platformStatusChip");
const systemStatusBanner = $("systemStatusBanner");
const authMessage = $("authMessage");

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
const aiAssistantFrame = $("aiAssistantFrame");
const aiAssistantStatus = $("aiAssistantStatus");
const openAiAssistantBtn = $("openAiAssistantBtn");
const openAiDocsBtn = $("openAiDocsBtn");

const sidebarAvatar = $("sidebarAvatar");
const sidebarName = $("sidebarName");
const sidebarEmail = $("sidebarEmail");
const sidebarFaculty = $("sidebarFaculty");
const sidebarSpecialty = $("sidebarSpecialty");
const sidebarCourse = $("sidebarCourse");
const sidebarDerivedName = $("sidebarDerivedName");
const logoutBtn = $("logoutBtn");
const goToChatBtn = $("goToChatBtn");
const heroOpenChatsBtn = $("heroOpenChatsBtn");
const heroOpenProfileBtn = $("heroOpenProfileBtn");
const dashboardBrowseChatsBtn = $("dashboardBrowseChatsBtn");

const heroPrimaryContext = $("heroPrimaryContext");
const favoriteCount = $("favoriteCount");
const dashboardFavoriteCount = $("dashboardFavoriteCount");
const totalChatsCount = $("totalChatsCount");
const totalUsersCount = $("totalUsersCount");
const onlineUsersCount = $("onlineUsersCount");
const storageModeLabel = $("storageModeLabel");
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
  const [firstNamePart = "", lastNamePart = ""] = localPart.split(/[._-]+/);
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

  return t("app.anonymous");
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
}

function setLanguage(nextLanguage) {
  currentLanguage = nextLanguage === "ru" ? "ru" : "en";
  localStorage.setItem("language", currentLanguage);
  applyStaticTranslations();
  const currentUser = getCurrentUser();
  renderStudents();
  renderFaculties();
  rebuildChatCatalog();
  updateModeUI(uiState.storageMode);
  if (currentUser) {
    applyUserProfileToUI(currentUser);
  }
  updateAiAssistantUI();
  switchSection(getSectionFromHash(), { updateHash: false });
}

function setTooltip(element, text) {
  if (element) {
    element.title = text || "";
  }
}

function normalizeSectionName(sectionName) {
  return getPageMeta()[sectionName] ? sectionName : "dashboard";
}

function getSectionFromHash() {
  return normalizeSectionName(window.location.hash.replace(/^#/, ""));
}

function showToast(message, type = "info") {
  if (!toastRegion || !message) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("toast-exit");
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function setInlineMessage(element, message, type = "info") {
  if (!element) return;

  if (!message) {
    element.hidden = true;
    element.textContent = "";
    element.dataset.type = "";
    return;
  }

  element.hidden = false;
  element.dataset.type = type;
  element.textContent = message;
}

function setButtonLoading(button, isLoading, loadingLabel) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent;
    }
    button.disabled = true;
    button.textContent = loadingLabel;
    return;
  }

  button.disabled = false;
  if (button.dataset.defaultLabel) {
    button.textContent = button.dataset.defaultLabel;
  }
}

function updateModeUI(storageMode) {
  uiState.storageMode = storageMode || "unknown";
  const isDemoMode = uiState.storageMode === "demo";

  if (platformStatusChip) {
    platformStatusChip.textContent = isDemoMode ? t("app.storageLocal") : uiState.storageMode === "database" ? t("app.storageActive") : t("app.storageUnknown");
    platformStatusChip.classList.toggle("chip-warning", isDemoMode);
  }

  if (storageModeLabel) {
    storageModeLabel.textContent = isDemoMode ? t("app.storageLocalShort") : uiState.storageMode === "database" ? t("app.storageOnline") : "...";
  }

  if (systemStatusBanner) {
    if (isDemoMode) {
      setInlineMessage(systemStatusBanner, currentLanguage === "ru" ? "Сейчас включен локальный режим, поэтому данные сохраняются только для текущего запуска." : "The platform is running in local mode, so data is stored only for the current session.", "warning");
    } else {
      setInlineMessage(systemStatusBanner, "", "info");
    }
  }
}

function getDefaultFavoriteRooms(user) {
  if (!user?.email) {
    return ["global", "general:events", "general:study-help"];
  }

  const email = String(user.email).toLowerCase();
  if (email === "turlybek_baiken@live.kaznu.kz") {
    return ["global", "general:events", "faculty:Факультет информационных технологий"];
  }

  if (email === "serik_alikhan@live.kaznu.kz") {
    return ["global", "general:events", "faculty:Международные отношения (ФМО)", "general:study-help"];
  }

  return ["global", "general:events", "general:study-help"];
}

function seedFavoriteRoomsIfNeeded() {
  const currentFavorites = getFavoriteRoomIds();
  if (currentFavorites.length) {
    appState.activeChatFilter = "favorites";
    return;
  }

  const seededFavorites = getDefaultFavoriteRooms(getCurrentUser())
    .filter((roomId) => Boolean(findChatById(roomId)));

  if (!seededFavorites.length) {
    appState.activeChatFilter = "all";
    return;
  }

  saveFavoriteRoomIds(seededFavorites);
  appState.activeChatFilter = "favorites";

  if (!findChatById(getLastRoomId())) {
    saveLastRoomId(seededFavorites[0]);
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
      title: currentLanguage === "ru" ? "Общий чат" : "General chat",
      subtitle: currentLanguage === "ru" ? "Главный поток для всех студентов КазНУ." : "The main feed for all KazNU students.",
      group: "general",
      tags: [currentLanguage === "ru" ? "Общий" : "General", currentLanguage === "ru" ? "Кампус" : "Campus"]
    },
    {
      id: "general:study-help",
      title: currentLanguage === "ru" ? "Учёба и дедлайны" : "Study and deadlines",
      subtitle: currentLanguage === "ru" ? "Обсуждение предметов, дедлайнов, сессии и помощи по учебе." : "Discuss courses, deadlines, exams, and peer support.",
      group: "general",
      tags: [currentLanguage === "ru" ? "Учёба" : "Study", currentLanguage === "ru" ? "Дедлайны" : "Deadlines"]
    },
    {
      id: "general:events",
      title: currentLanguage === "ru" ? "Мероприятия КазНУ" : "KazNU events",
      subtitle: currentLanguage === "ru" ? "Лекции, форумы, клубы, ивенты и студенческие встречи." : "Lectures, forums, clubs, and student meetups.",
      group: "general",
      tags: [currentLanguage === "ru" ? "События" : "Events", currentLanguage === "ru" ? "Нетворкинг" : "Networking"]
    },
    {
      id: "general:marketplace",
      title: currentLanguage === "ru" ? "Маркетплейс студентов" : "Student marketplace",
      subtitle: currentLanguage === "ru" ? "Обмен вещами, услуги, совместные покупки и полезные объявления." : "Swap items, offer services, coordinate purchases, and share useful notices.",
      group: "general",
      tags: [currentLanguage === "ru" ? "Маркет" : "Marketplace", currentLanguage === "ru" ? "Объявления" : "Announcements"]
    }
  ];

  const facultyNames = Object.keys(FACULTIES).sort((left, right) => left.localeCompare(right, "ru"));

  facultyNames.forEach((facultyName) => {
    chats.push({
      id: `faculty:${facultyName}`,
      title: facultyName,
      subtitle: currentLanguage === "ru" ? `Основной чат факультета ${facultyName}.` : `The main room for ${facultyName}.`,
      group: "faculty",
      faculty: facultyName,
      tags: [t("app.facultyTag"), facultyName]
    });

    (FACULTIES[facultyName] || []).forEach((specialtyName) => {
      chats.push({
        id: `specialty:${facultyName}:${specialtyName}`,
        title: specialtyName,
        subtitle: currentLanguage === "ru" ? `Чат специальности ${specialtyName} на факультете ${facultyName}.` : `A specialty room for ${specialtyName} in ${facultyName}.`,
        group: "specialty",
        faculty: facultyName,
        specialty: specialtyName,
        tags: [t("app.specialtyTag"), facultyName]
      });
    });
  });

  for (let dormNumber = 1; dormNumber <= 18; dormNumber += 1) {
    chats.push({
      id: `dorm:${dormNumber}`,
      title: currentLanguage === "ru" ? `Дом студентов ${dormNumber}` : `Student residence ${dormNumber}`,
      subtitle: currentLanguage === "ru" ? `Обсуждение жизни, быта и новостей в доме студентов ${dormNumber}.` : `Living, logistics, and news for residence ${dormNumber}.`,
      group: "dorm",
      dorm: dormNumber,
      tags: [t("app.dormTag"), `${currentLanguage === "ru" ? "ДС" : "Hall"} ${dormNumber}`]
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
    if (!chats.length) {
      chats = appState.allChats;
    }
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

      return `
        <article class="room-card${activeClass}">
          <div class="room-card-head">
            <div class="room-card-body" role="button" tabindex="0" data-open-room="${escapeHtml(chat.id)}">
              <strong>${escapeHtml(chat.title)}</strong>
              <div class="room-card-subtitle">${escapeHtml(chat.subtitle)}</div>
            </div>
            <button class="favorite-toggle-btn${favoriteClass}" type="button" data-favorite-room="${escapeHtml(chat.id)}" aria-label="Добавить в избранное">
              ${favoriteIds.has(chat.id) ? "★" : "☆"}
            </button>
          </div>
        </article>
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
          <button class="ghost-inline-btn" type="button" data-open-room="${escapeHtml(chat.id)}">${escapeHtml(t("app.open"))}</button>
        </div>
        <div>${(chat.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    `)
    .join("");

  dashboardRecommendedChats.innerHTML = cards || `<div class="empty-dashboard-state">${escapeHtml(t("app.recommendationsEmpty"))}</div>`;
}

function renderDashboardFavorites() {
  if (!dashboardFavoriteChats) return;

  const favorites = getFavoriteRoomIds()
    .map((roomId) => findChatById(roomId))
    .filter(Boolean);

  if (!favorites.length) {
    dashboardFavoriteChats.innerHTML = `<div class="empty-dashboard-state">${escapeHtml(t("app.favoritesEmpty"))}</div>`;
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
          <button class="ghost-inline-btn" type="button" data-open-room="${escapeHtml(chat.id)}">${escapeHtml(t("app.open"))}</button>
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

  heroPrimaryContext.textContent = parts || t("app.heroFallback");
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
  favoriteRoomBtn.textContent = favorite ? t("chat.favoriteSaved") : t("chat.favoriteAdd");
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

function switchSection(sectionName, options = {}) {
  const nextSection = normalizeSectionName(sectionName);
  const { updateHash = true } = options;
  const pageMeta = getPageMeta();
  appState.activeSection = nextSection;

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === nextSection);
  });

  sections.forEach((section) => {
    section.classList.toggle("active", section.id === `section-${nextSection}`);
  });

  if (pageMeta[nextSection]) {
    pageTitle.textContent = pageMeta[nextSection].title;
    pageSubtitle.textContent = pageMeta[nextSection].subtitle;
    pageSubtitle.style.display = pageMeta[nextSection].subtitle ? "block" : "none";
  }

  if (nextSection === "chat") {
    renderAllDynamicPanels();
  }

  if (nextSection === "ai") {
    updateAiAssistantUI();
  }

  if (updateHash && window.location.hash !== `#${nextSection}`) {
    window.location.hash = nextSection;
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
  if (sidebarEmail) sidebarEmail.textContent = user.email || t("app.emailMissing");
  if (sidebarFaculty) sidebarFaculty.textContent = `${t("profile.faculty")}: ${user.faculty || t("app.notSelected")}`;
  if (sidebarSpecialty) sidebarSpecialty.textContent = `${t("profile.specialty")}: ${user.specialty || t("app.notSelected")}`;
  if (sidebarCourse) sidebarCourse.textContent = `${t("profile.course")}: ${user.course || t("app.notSelected")}`;
  if (sidebarDerivedName) sidebarDerivedName.textContent = `${t("profile.realName")}: ${realName || t("app.unavailable")}`;

  setTooltip(sidebarName, displayName);
  setTooltip(sidebarEmail, user.email || "");
  setTooltip(sidebarFaculty, sidebarFaculty?.textContent || "");
  setTooltip(sidebarSpecialty, sidebarSpecialty?.textContent || "");
  setTooltip(sidebarCourse, sidebarCourse?.textContent || "");
  setTooltip(sidebarDerivedName, sidebarDerivedName?.textContent || "");

  if (topbarRole) {
    topbarRole.textContent = user.role === "admin" ? t("app.roleAdmin") : t("app.roleStudent");
  }

  if (usernameInput) usernameInput.value = displayName;
  if (editDisplayName) editDisplayName.value = user.displayName || "";
  if (editEmail) editEmail.value = user.email || "";
  if (editFaculty) editFaculty.value = user.faculty || "";
  if (editSpecialty) editSpecialty.value = user.specialty || "";
  if (editCourse) editCourse.value = user.course ? `${user.course} ${t("app.courseSuffix")}` : "";
  if (editRealName) editRealName.value = realName;
  if (editBio) editBio.value = user.bio || "";

  renderAllDynamicPanels();
}

function renderEvents(items) {
  if (!eventsList) return;

  eventsList.innerHTML = "";
  if (eventsCount) eventsCount.textContent = String(items.length);

  if (!items.length) {
    eventsList.innerHTML = `<div class="empty-dashboard-state">${escapeHtml(t("app.eventsEmpty"))}</div>`;
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="muted card-spacer">${escapeHtml(item.description)}</div>
      <div class="muted card-spacer"><strong>${escapeHtml(item.date)}</strong> • ${escapeHtml(item.place)}</div>
      <div class="muted card-spacer">${escapeHtml(item.faculty || t("app.allFaculties"))}</div>
      <div>${(item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    `;
    eventsList.appendChild(div);
  });
}

function renderAnnouncements(items) {
  if (!announcementsList) return;

  announcementsList.innerHTML = "";
  if (!items.length) {
    announcementsList.innerHTML = `<div class="empty-dashboard-state">${escapeHtml(t("app.announcementsEmpty"))}</div>`;
    return;
  }

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
          text: currentLanguage === "ru" ? `${FACULTIES[facultyName].length} специальностей доступны в каталоге чатов.` : `${FACULTIES[facultyName].length} specialties are available in the chat catalog.`,
          tags: [t("app.facultyTag"), currentLanguage === "ru" ? `${FACULTIES[facultyName].length} чатов по направлениям` : `${FACULTIES[facultyName].length} program-specific rooms`]
        }))
    : getFallbackFacultiesData();

  renderCards(facultiesList, items, "faculty-card");
}

function renderStudents() {
  renderCards(studentsList, getStudentsData(), "student-card");
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

  const messageId = message._id || message.id;
  const deleteButton = currentUser && currentUser.role === "admin" && messageId
    ? `<button class="delete-message-btn" data-id="${escapeHtml(messageId)}" type="button">${escapeHtml(t("app.delete"))}</button>`
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
    if (!res.ok) {
      throw new Error("Не удалось загрузить статистику");
    }
    const data = await res.json();

    if (totalUsersCount) totalUsersCount.textContent = String(data.totalUsers ?? 0);
    if (onlineUsersCount) onlineUsersCount.textContent = String(data.onlineUsers ?? 0);
    updateModeUI(data.storageMode || "database");
  } catch (err) {
    console.error("Ошибка загрузки статистики:", err);
    updateModeUI("unknown");
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

async function loadRuntimeConfig() {
  try {
    const response = await fetch("/api/runtime-config");
    if (!response.ok) {
      throw new Error("Runtime config is unavailable");
    }

    const data = await response.json();
    runtimeConfig.aiAssistantUrl = data.aiAssistantUrl || "";
    runtimeConfig.aiAssistantDocsUrl = data.aiAssistantDocsUrl || "";
  } catch {
    runtimeConfig.aiAssistantUrl = "";
    runtimeConfig.aiAssistantDocsUrl = "";
  }

  updateAiAssistantUI();
}

function updateAiAssistantUI() {
  const shouldLoadAssistant = appState.activeSection === "ai" && Boolean(runtimeConfig.aiAssistantUrl);

  if (openAiAssistantBtn) {
    openAiAssistantBtn.href = runtimeConfig.aiAssistantUrl || "#";
    openAiAssistantBtn.setAttribute("aria-disabled", runtimeConfig.aiAssistantUrl ? "false" : "true");
  }

  if (openAiDocsBtn) {
    openAiDocsBtn.href = runtimeConfig.aiAssistantDocsUrl || runtimeConfig.aiAssistantUrl || "#";
    openAiDocsBtn.setAttribute("aria-disabled", runtimeConfig.aiAssistantDocsUrl || runtimeConfig.aiAssistantUrl ? "false" : "true");
  }

  if (aiAssistantFrame) {
    aiAssistantFrame.src = shouldLoadAssistant ? runtimeConfig.aiAssistantUrl : "about:blank";
  }

  if (aiAssistantStatus) {
    if (!runtimeConfig.aiAssistantUrl) {
      aiAssistantStatus.textContent = t("ai.loading");
      aiAssistantStatus.dataset.type = "warning";
      return;
    }

    aiAssistantStatus.textContent = shouldLoadAssistant
      ? t("ai.ready")
      : (currentLanguage === "ru"
          ? "AI-ассистент готов. Откройте раздел AI-чат, чтобы загрузить интерфейс."
          : "AI assistant is ready. Open the AI Chat section to load the workspace.");
    aiAssistantStatus.dataset.type = "success";
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
  seedFavoriteRoomsIfNeeded();
  renderAllDynamicPanels();
  setActiveRoom(findChatById(getLastRoomId()) ? getLastRoomId() : "global");
  switchSection(getSectionFromHash(), { updateHash: false });
  startPresenceHeartbeat();
}

function sendMessage() {
  const currentUser = getCurrentUser();
  const text = messageInput?.value.trim();

  if (!currentUser) {
    showToast(t("toast.signInRequired"), "warning");
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
    showToast(t("toast.signInRequired"), "warning");
    return;
  }

  setButtonLoading(saveProfileEditBtn, true, currentLanguage === "ru" ? "Сохраняем..." : "Saving...");
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
      showToast(data.error || "Не удалось обновить профиль", "error");
      return;
    }

    saveCurrentUser(data.user);
    applyUserProfileToUI(data.user);
    rebuildChatCatalog();
    showToast(t("toast.profileUpdated"), "success");
  } catch (err) {
    console.error("Ошибка обновления профиля:", err);
    showToast(t("toast.serverError"), "error");
  } finally {
    setButtonLoading(saveProfileEditBtn, false, currentLanguage === "ru" ? "Сохраняем..." : "Saving...");
  }
}

async function handleAddEvent() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    showToast(t("toast.accessDenied"), "error");
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
    showToast(t("toast.fillEvent"), "warning");
    return;
  }

  setButtonLoading(addEventBtn, true, currentLanguage === "ru" ? "Добавляем..." : "Adding...");
  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Не удалось добавить мероприятие", "error");
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
    showToast(t("toast.eventAdded"), "success");
  } catch (err) {
    console.error("Ошибка добавления мероприятия:", err);
    showToast(t("toast.serverError"), "error");
  } finally {
    setButtonLoading(addEventBtn, false, currentLanguage === "ru" ? "Добавляем..." : "Adding...");
  }
}

async function handleAddAnnouncement() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    showToast(t("toast.accessDenied"), "error");
    return;
  }

  const payload = {
    title: announcementTitle.value.trim(),
    text: announcementText.value.trim(),
    meta: announcementMeta.value.trim(),
    adminEmail: currentUser.email
  };

  if (!payload.title || !payload.text || !payload.meta) {
    showToast(t("toast.fillAnnouncement"), "warning");
    return;
  }

  setButtonLoading(addAnnouncementBtn, true, currentLanguage === "ru" ? "Добавляем..." : "Adding...");
  try {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Не удалось добавить объявление", "error");
      return;
    }

    announcementTitle.value = "";
    announcementText.value = "";
    announcementMeta.value = "";

    await loadAnnouncements();
    showToast(t("toast.announcementAdded"), "success");
  } catch (err) {
    console.error("Ошибка добавления объявления:", err);
    showToast(t("toast.serverError"), "error");
  } finally {
    setButtonLoading(addAnnouncementBtn, false, currentLanguage === "ru" ? "Добавляем..." : "Adding...");
  }
}

async function handleMakeAdmin() {
  const currentUser = getCurrentUser();
  const targetEmail = newAdminEmail.value.trim().toLowerCase();

  if (!currentUser || currentUser.role !== "admin") {
    showToast(t("toast.accessDenied"), "error");
    return;
  }

  if (!targetEmail) {
    showToast(currentLanguage === "ru" ? "Введите почту пользователя." : "Enter the user's email.", "warning");
    return;
  }

  setButtonLoading(makeAdminBtn, true, currentLanguage === "ru" ? "Назначаем..." : "Promoting...");
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
      showToast(data.error || "Ошибка назначения админа", "error");
      return;
    }

    newAdminEmail.value = "";
    showToast(t("toast.adminGranted"), "success");
  } catch (err) {
    console.error("Ошибка назначения админа:", err);
    showToast(t("toast.serverError"), "error");
  } finally {
    setButtonLoading(makeAdminBtn, false, currentLanguage === "ru" ? "Назначаем..." : "Promoting...");
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

    roomList.addEventListener("keydown", (event) => {
      const roomBtn = event.target.closest("[data-open-room]");
      if (!roomBtn) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
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
  if (goToChatBtn) goToChatBtn.addEventListener("click", () => switchSection("chat"));
  if (heroOpenChatsBtn) heroOpenChatsBtn.addEventListener("click", () => switchSection("chat"));
  if (heroOpenProfileBtn) heroOpenProfileBtn.addEventListener("click", () => switchSection("profile"));
  if (dashboardBrowseChatsBtn) dashboardBrowseChatsBtn.addEventListener("click", () => switchSection("chat"));
  if (languageToggle) {
    languageToggle.addEventListener("click", () => {
      setLanguage(currentLanguage === "en" ? "ru" : "en");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("/api/logout", {
        method: "POST"
      }).catch(() => null);
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
      showToast(t("toast.accessDenied"), "error");
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
        showToast(data.error || "Не удалось удалить сообщение", "error");
        return;
      }

      btn.closest(".message")?.remove();
      showToast(t("toast.messageDeleted"), "success");
    } catch (err) {
      console.error(err);
      showToast(t("toast.serverError"), "error");
    }
  });

  window.addEventListener("hashchange", () => {
    switchSection(getSectionFromHash(), { updateHash: false });
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
  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginBtn = $("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = loginEmail.value.trim().toLowerCase();
      const password = loginPassword.value.trim();

      if (!email || !password) {
        setInlineMessage(authMessage, t("toast.loginRequired"), "error");
        return;
      }

      setButtonLoading(loginBtn, true, currentLanguage === "ru" ? "Входим..." : "Signing in...");
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          setInlineMessage(authMessage, data.error || (currentLanguage === "ru" ? "Ошибка входа" : "Sign-in failed"), "error");
          return;
        }

        saveCurrentUser(data.user);
        await applyAccess();
        await sendPresencePing();
        await loadStats();
        switchSection(getSectionFromHash(), { updateHash: false });
        showToast(t("toast.welcome", { name: buildDisplayName(data.user) }), "success");
        setInlineMessage(authMessage, "", "info");
      } catch (err) {
        console.error(err);
        setInlineMessage(authMessage, t("toast.serverError"), "error");
      } finally {
        setButtonLoading(loginBtn, false, currentLanguage === "ru" ? "Входим..." : "Signing in...");
      }
    });
  }
}

async function initApp() {
  applyStaticTranslations();
  initTheme();
  bindStaticUI();
  bindRealtime();
  await initAuthFlow();
  renderStudents();
  switchSection(getSectionFromHash(), { updateHash: false });

  await loadRuntimeConfig();
  await loadFaculties();
  renderFaculties();
  rebuildChatCatalog();

  await Promise.all([loadEvents(), loadAnnouncements(), loadStats()]);
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
