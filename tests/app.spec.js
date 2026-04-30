import { expect, test } from "@playwright/test";

async function loginAs(page, role) {
  await page.goto("/");
  await page.locator("#loginEmail").fill(role === "admin" ? "turlybek_baiken@live.kaznu.kz" : "serik_alikhan@live.kaznu.kz");
  await page.locator("#loginPassword").fill(role === "admin" ? "admin123" : "student123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#appShell")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#authScreen")).toBeHidden({ timeout: 10000 });
  await expect(page.locator("#pageTitle")).toHaveText(/Home|Главная/, { timeout: 10000 });
}

async function openNavItem(page, label) {
  const sectionMap = {
    "Home": "dashboard",
    "Chats": "chat",
    "AI Chat": "ai",
    "Announcements": "announcements",
    "Events": "events",
    "Profile": "profile",
    "Admin": "admin"
  };
  const menuToggle = page.getByRole("button", { name: "Open menu" });
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

  await expect(page.locator("#platformStatusChip")).toHaveText(/Local mode|Service online/);
  await openNavItem(page, "Profile");
  await expect(page).toHaveURL(/#profile$/);

  await page.getByRole("textbox", { name: "Display name" }).fill("QA Student");
  await page.getByRole("textbox", { name: "About" }).fill("Automated test verifies profile updates.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("QA Student").first()).toBeVisible();

  await openNavItem(page, "Chats");
  await expect(page).toHaveURL(/#chat$/);
  await page.getByRole("button", { name: "All chats" }).click();
  await expect(page.locator("#roomList [data-open-room]").first()).toBeVisible();

  await openNavItem(page, "AI Chat");
  await expect(page).toHaveURL(/#ai$/);
  await expect(page.locator("#aiAssistantFrame")).toBeVisible();
});

test("admin can create event and announcement in demo mode", async ({ page }) => {
  const eventTitle = `Playwright event ${Date.now()}`;
  const announcementTitle = `Playwright announcement ${Date.now()}`;

  await loginAs(page, "admin");
  await openNavItem(page, "Admin");
  await expect(page).toHaveURL(/#admin$/);

  await page.locator("#eventTitle").fill(eventTitle);
  await page.locator("#eventDescription").fill("Проверка публикации события из автотеста.");
  await page.locator("#eventDate").fill("30 апреля • 16:00");
  await page.locator("#eventPlace").fill("Coworking zone");
  await page.locator("#eventFaculty").fill("Все факультеты");
  await page.locator("#eventTags").fill("E2E, QA");
  await page.getByRole("button", { name: "Add event" }).click();
  await expect(page.locator("#eventTitle")).toHaveValue("");

  await page.locator("#announcementTitle").fill(announcementTitle);
  await page.locator("#announcementText").fill("Проверка публикации объявления из автотеста.");
  await page.locator("#announcementMeta").fill("Админ • Автотест");
  await page.getByRole("button", { name: "Add announcement" }).click();
  await expect(page.locator("#announcementTitle")).toHaveValue("");

  await openNavItem(page, "Events");
  await expect(page.getByText(eventTitle)).toBeVisible();

  await openNavItem(page, "Announcements");
  await expect(page.getByText(announcementTitle)).toBeVisible();
});