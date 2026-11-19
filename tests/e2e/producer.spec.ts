import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const password = "Phase05-Local-1";
const stamp = Date.now().toString(36);
const producerEmail = `producer-${stamp}@phase05.test`;
const reviewerEmail = `reviewer-${stamp}@phase05.test`;
const pendingEmail = `pending-${stamp}@phase05.test`;

function localEnv() {
  const raw = execSync("supabase status -o env", { encoding: "utf8", windowsHide: true });
  const values = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line);
    if (match) {
      values.set(match[1], match[2]);
    }
  }
  return {
    dbUrl: values.get("DB_URL") ?? "",
    mailUrl: values.get("MAILPIT_URL") ?? values.get("INBUCKET_URL") ?? "",
  };
}

async function register(page: Page, email: string, name: string) {
  await page.goto("/register");
  await page.getByRole("textbox", { name: "Full name" }).fill(name);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("checkbox", { name: /account terms/i }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
}

async function confirmationLink(mailUrl: string, email: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const list = await fetch(`${mailUrl}/api/v1/messages`);
    const body = (await list.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
    const message = (body.messages ?? []).find((item) => item.To?.some((to) => to.Address === email));
    if (message) {
      const full = await fetch(`${mailUrl}/api/v1/message/${message.ID}`);
      const mail = (await full.json()) as { Text?: string; HTML?: string };
      const text = `${mail.Text ?? ""}\n${mail.HTML ?? ""}`.replaceAll("&amp;", "&");
      const link = text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
      if (link) {
        return link;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("The local mail capture did not contain a confirmation link.");
}

async function confirm(page: Page, mailUrl: string, email: string) {
  const link = await confirmationLink(mailUrl, email);
  await page.goto(link);
  await page.waitForURL(/localhost:3000|127\.0\.0\.1:3000/);
}

async function login(page: Page, email: string, nextPath = "/account") {
  await page.goto(`/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(new RegExp(nextPath.replace("/", "\\/")));
}

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("producer storefront works for an approved account and stays closed for everyone else", async ({ page, browser }) => {
  test.setTimeout(300_000);
  const { dbUrl, mailUrl } = localEnv();
  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  try {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
    for (const width of [360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await noHorizontalOverflow(page);
    }
    await page.setViewportSize({ width: 1280, height: 900 });

    await register(page, reviewerEmail, "Local Reviewer");
    await db.query("insert into public.user_roles (user_id, role) select id, 'reviewer' from auth.users where email = $1", [reviewerEmail]);
    await confirm(page, mailUrl, reviewerEmail);

    await register(page, producerEmail, "Local Producer");
    await confirm(page, mailUrl, producerEmail);
    await login(page, producerEmail, "/business/apply");
    await page.getByRole("button", { name: "Start a draft" }).click();
    await page.waitForURL(/\/business\/apply\/[0-9a-f-]+/);
    await page.getByLabel("Business name").fill(`Local Producer ${stamp}`);
    await page.getByLabel("Description").fill("A disposable local producer used to verify the storefront.");
    await page.getByLabel("Country").selectOption("UG");
    await page.getByLabel("Business email").fill(producerEmail);
    await page.getByLabel("Business telephone").fill("0700000001");
    await page.locator('input[name="category"]').first().check();
    await page.getByLabel("Your position or relationship to the business").fill("Owner");
    await page.getByRole("checkbox", { name: /authorised/i }).check();
    await page.getByRole("checkbox", { name: /accurate/i }).check();
    await page.getByRole("checkbox", { name: /consent/i }).check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page).toHaveURL(/application-submitted/);

    const reviewerContext = await browser.newContext();
    const reviewer = await reviewerContext.newPage();
    await login(reviewer, reviewerEmail, "/review");
    await expect(reviewer.getByText(`Local Producer ${stamp}`)).toBeVisible();
    await reviewer.getByRole("listitem").getByRole("link", { name: "Review" }).click();
    await reviewer.waitForURL(/\/review\/applications\//);
    await reviewer.getByLabel("Decision").selectOption("approved");
    await reviewer.getByLabel("Message the applicant can see").fill("Approved for the local check.");
    await reviewer.getByLabel("Internal note").fill("Local review note");
    await reviewer.getByRole("button", { name: "Record decision" }).click();
    await expect(reviewer.getByText("Decision recorded.")).toBeVisible();
    await reviewerContext.close();

    await login(page, producerEmail, "/dashboard");
    await expect(page.getByText(`Local Producer ${stamp}`, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Storefront", exact: true }).click();
    await page.getByLabel("Description").fill("Updated local storefront description for the public page.");
    await page.getByLabel("City").fill("Kampala");
    await page.getByLabel("Website").fill("https://producer.example.test");
    await page.getByLabel("Contact email").fill(producerEmail);
    await page.getByRole("button", { name: "Save storefront" }).click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Listings", exact: true }).click();
    await page.getByRole("link", { name: "New listing", exact: true }).click();
    await page.getByLabel("Product name").fill(`Local listing ${stamp}`);
    await page.getByLabel("Slug").fill(`local-listing-${stamp}`);
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByLabel("Short description").fill("A local listing summary.");
    await page.getByRole("button", { name: "Create draft" }).click();
    await page.waitForURL(/\/dashboard\/products\/[0-9a-f-]+\/edit/);
    await page.getByLabel("Description", { exact: true }).fill("A longer local listing description.");
    await page.getByRole("button", { name: "Save listing" }).click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
    await page.locator("#product-image").setInputFiles({
      name: "local.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Confirm removal" }).check();
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();
    await page.locator("#product-image").setInputFiles({
      name: "local.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    });
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByText("Saved.", { exact: true })).toBeVisible();

    const productPath = new URL(page.url()).pathname;
    const productId = productPath.split("/")[3];
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Status: published", { exact: true })).toBeVisible();
    const slug = await db.query("select slug from public.products where id = $1", [productId]);
    const business = await db.query(
      "select slug from public.businesses where id = (select business_id from public.products where id = $1)",
      [productId],
    );
    const productSlug = String(slug.rows[0].slug);
    const businessSlug = String(business.rows[0].slug);
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    const client = await visitorContext.newCDPSession(visitor);
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    const published = await visitor.goto(`/shop/${productSlug}`);
    expect(published?.status()).toBe(200);
    await expect(visitor.getByRole("heading", { name: `Local listing ${stamp}` })).toBeVisible();
    const storefront = await visitor.goto(`/businesses/${businessSlug}`);
    expect(storefront?.status()).toBe(200);
    await expect(visitor.getByText(producerEmail)).toHaveCount(0);

    await page.getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByText("Status: unpublished", { exact: true })).toBeVisible();
    const hidden = await visitor.request.get(`/shop/${productSlug}`);
    expect(hidden.status(), (await hidden.text()).slice(0, 400)).toBe(404);
    const hiddenPage = await visitor.goto(`/shop/${productSlug}`);
    expect(hiddenPage?.status()).toBe(404);

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Status: published", { exact: true })).toBeVisible();
    await page.getByRole("checkbox", { name: "Confirm archive" }).check();
    await page.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Status: archived", { exact: true })).toBeVisible();
    const archived = await visitor.request.get(`/shop/${productSlug}`);
    expect(archived.status(), (await archived.text()).slice(0, 400)).toBe(404);

    await db.query("update public.businesses set approval_status = 'suspended' where slug = $1", [businessSlug]);
    await page.goto("/dashboard");
    await expect(page.getByText("This business is suspended. Listings cannot be managed until the suspension is lifted.")).toBeVisible();
    await expect(page.getByRole("link", { name: "New listing" })).toHaveCount(0);

    await db.query("alter table public.business_applications disable trigger business_applications_enforce_change");
    try {
      await db.query(
        "update public.business_applications set business_kind = 'manufacturer' where business_id = (select id from public.businesses where slug = $1)",
        [businessSlug],
      );
      await db.query("update public.businesses set approval_status = 'approved' where slug = $1", [businessSlug]);
    } finally {
      await db.query("alter table public.business_applications enable trigger business_applications_enforce_change");
    }
    await page.goto("/dashboard");
    await expect(page.getByText("This workspace is for approved producers. This business is registered as a manufacturer.")).toBeVisible();

    await db.query("alter table public.business_applications disable trigger business_applications_enforce_change");
    try {
      await db.query(
        "update public.business_applications set business_kind = 'producer' where business_id = (select id from public.businesses where slug = $1)",
        [businessSlug],
      );
      await db.query("update public.businesses set approval_status = 'pending' where slug = $1", [businessSlug]);
    } finally {
      await db.query("alter table public.business_applications enable trigger business_applications_enforce_change");
    }
    await page.goto("/dashboard");
    await expect(page.getByText("This business is still waiting for review. The producer workspace opens after approval.")).toBeVisible();
    await visitorContext.close();

    await register(page, pendingEmail, "Pending Producer");
    await confirm(page, mailUrl, pendingEmail);
    await login(page, pendingEmail, "/dashboard");
    await expect(page.getByText("You do not belong to a business yet.")).toBeVisible();

    const otherContext = await browser.newContext();
    const other = await otherContext.newPage();
    await login(other, reviewerEmail, `/dashboard/products/${productId}/edit`);
    await expect(other.getByText("You do not belong to a business yet.")).toBeVisible();
    await expect(other.getByRole("button", { name: "Publish" })).toHaveCount(0);
    await otherContext.close();

    for (const width of [360, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/shop");
      await noHorizontalOverflow(page);
    }
  } finally {
    await db.query("alter table public.business_application_events disable trigger business_application_events_immutable");
    await db.query("alter table public.business_application_internal_notes disable trigger business_application_notes_immutable");
    try {
      await db.query("delete from public.product_images where product_id in (select id from public.products where business_id in (select id from public.businesses where created_by in (select id from auth.users where email = any($1))))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.products where business_id in (select id from public.businesses where created_by in (select id from auth.users where email = any($1)))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_application_documents where application_id in (select id from public.business_applications where applicant_id in (select id from auth.users where email = any($1)))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_application_internal_notes where application_id in (select id from public.business_applications where applicant_id in (select id from auth.users where email = any($1)))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_application_events where application_id in (select id from public.business_applications where applicant_id in (select id from auth.users where email = any($1)))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_application_categories where application_id in (select id from public.business_applications where applicant_id in (select id from auth.users where email = any($1)))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_applications where applicant_id in (select id from auth.users where email = any($1))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.business_members where user_id in (select id from auth.users where email = any($1))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from public.businesses where created_by in (select id from auth.users where email = any($1))", [[producerEmail, reviewerEmail, pendingEmail]]);
      await db.query("delete from auth.users where email = any($1)", [[producerEmail, reviewerEmail, pendingEmail]]);
    } finally {
      await db.query("alter table public.business_applications enable trigger business_applications_enforce_change");
      await db.query("alter table public.business_application_events enable trigger business_application_events_immutable");
      await db.query("alter table public.business_application_internal_notes enable trigger business_application_notes_immutable");
      await db.end();
    }
  }
});
