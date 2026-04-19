import { expect, test } from "@playwright/test";

async function loginAs(page, role) {
  await page.goto("/");
  await page.getByRole("button", { name: role === "admin" ? "Заполнить админа" : "Заполнить студента" }).click();
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible();
}

async function openNavItem(page, label) {
  const sectionMap = {
    "Главная": "dashboard",
    "Чаты": "chat",
    "Объявления": "announcements",
    "События": "events",
    "Профиль": "profile",
    "Админ": "admin"
  };
  const menuToggle = page.getByRole("button", { name: "Открыть меню" });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
    await page.waitForFunction(() => document.body.classList.contains("sidebar-open"));
  }

  if (sectionMap[label]) {
    await page.locator(`[data-section="${sectionMap[label]}"]`).evaluate((element) => element.click());
    return;
  }

  await page.getByRole("button", { name: label, exact: true }).click();
}

test("student can log in, navigate, and update profile", async ({ page }) => {
  await loginAs(page, "student");

  await expect(page.locator("#platformStatusChip")).toHaveText("Демо-хранилище");
  await openNavItem(page, "Профиль");
  await expect(page).toHaveURL(/#profile$/);

  await page.getByRole("textbox", { name: "Отображаемое имя" }).fill("QA Student");
  await page.getByRole("textbox", { name: "О себе" }).fill("Автотест проверяет обновление профиля.");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.getByText("QA Student").first()).toBeVisible();

  await openNavItem(page, "Чаты");
  await expect(page).toHaveURL(/#chat$/);
  await page.getByRole("button", { name: "Все чаты" }).click();
  await expect(page.locator("#roomList [data-open-room]").first()).toBeVisible();
});

test("admin can create event and announcement in demo mode", async ({ page }) => {
  const eventTitle = `Playwright event ${Date.now()}`;
  const announcementTitle = `Playwright announcement ${Date.now()}`;

  await loginAs(page, "admin");
  await openNavItem(page, "Админ");
  await expect(page).toHaveURL(/#admin$/);

  await page.locator("#eventTitle").fill(eventTitle);
  await page.locator("#eventDescription").fill("Проверка публикации события из автотеста.");
  await page.locator("#eventDate").fill("30 апреля • 16:00");
  await page.locator("#eventPlace").fill("Coworking zone");
  await page.locator("#eventFaculty").fill("Все факультеты");
  await page.locator("#eventTags").fill("E2E, QA");
  await page.getByRole("button", { name: "Добавить событие" }).click();
  await expect(page.locator("#eventTitle")).toHaveValue("");

  await page.locator("#announcementTitle").fill(announcementTitle);
  await page.locator("#announcementText").fill("Проверка публикации объявления из автотеста.");
  await page.locator("#announcementMeta").fill("Админ • Автотест");
  await page.getByRole("button", { name: "Добавить объявление" }).click();
  await expect(page.locator("#announcementTitle")).toHaveValue("");

  await openNavItem(page, "События");
  await expect(page.getByText(eventTitle)).toBeVisible();

  await openNavItem(page, "Объявления");
  await expect(page.getByText(announcementTitle)).toBeVisible();
});