import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { Client, Pool, type QueryResult } from "pg";
import { readLocalSupabase, type LocalSupabase } from "./local-env";

const password = "Phase05-Local-1";

type Query = (sql: string, params?: unknown[]) => Promise<QueryResult>;
type Identity = {
  id: string;
  email: string;
  token: string;
};

const ids: Record<string, Identity> = {};
const apps: Record<string, string> = {};
const businesses: Record<string, string> = {};
const products: Record<string, string> = {};
let env: LocalSupabase;
let pool: Pool;
let categoryId = "";
let inactiveCategoryId = "";

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function admin(sql: string, params: unknown[] = []) {
  return pool.query(sql, params);
}

async function act<T>(userId: string | null, fn: (query: Query) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (userId === null) {
      await client.query("set local role anon");
    } else {
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: userId, role: "authenticated" }),
      ]);
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      await client.query("select set_config('request.jwt.claim.role', 'authenticated', true)");
      await client.query("set local role authenticated");
    }
    const value = await fn((sql, params = []) => client.query(sql, params));
    await client.query("commit");
    return value;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // The failed statement already aborted the transaction.
    }
    throw error;
  } finally {
    client.release();
  }
}

async function expectFailure(userId: string | null, fn: (query: Query) => Promise<unknown>, pattern: RegExp) {
  try {
    await act(userId, fn);
  } catch (error) {
    assert.match(errorText(error), pattern);
    return errorText(error);
  }
  assert.fail(`expected ${pattern}`);
}

async function createUser(key: string, name: string) {
  const email = `${key}@phase05.test`;
  const response = await fetch(`${env.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: env.serviceRoleKey,
      authorization: `Bearer ${env.serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, terms_accepted: "true" },
    }),
  });
  const body = (await response.json()) as { id?: string; user?: { id: string }; msg?: string; message?: string };
  if (!response.ok || !(body.id ?? body.user?.id)) {
    throw new Error(`Could not create ${email}: ${response.status} ${body.msg ?? body.message ?? "no id"}`);
  }
  const token = await signIn(email);
  ids[key] = { id: body.id ?? body.user?.id ?? "", email, token };
}

async function signIn(email: string) {
  const response = await fetch(`${env.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json()) as { access_token?: string; error_description?: string; msg?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Could not sign in ${email}: ${response.status} ${body.error_description ?? body.msg ?? "no token"}`);
  }
  return body.access_token;
}

async function startApplication(userId: string, slug: string) {
  const result = await act(userId, (query) => query("select public.start_business_application($1) as id", [slug]));
  return String(result.rows[0].id);
}

async function saveApplication(userId: string, applicationId: string, slug: string, status: string, kind = "producer") {
  await act(userId, (query) =>
    query(
      `select public.save_business_application(
        p_application_id => $1::uuid,
        p_display_name => $2,
        p_slug => $3,
        p_status => $4::public.application_status,
        p_business_kind => $5::public.business_kind,
        p_description => 'Disposable local verification description.',
        p_country_code => 'UG',
        p_district => 'Kampala',
        p_city => 'Kampala',
        p_address => null,
        p_website => null,
        p_business_email => $6,
        p_business_phone => '0700000001',
        p_whatsapp_phone => null,
        p_registration_standing => 'not_required'::public.registration_standing,
        p_registration_authority => null,
        p_registration_number => null,
        p_tax_identification => null,
        p_main_offerings => null,
        p_activities => null,
        p_regions_served => null,
        p_operations_summary => null,
        p_years_operating => 1,
        p_applicant_position => 'Owner',
        p_authorised => true,
        p_accuracy => true,
        p_consent => true,
        p_category_ids => $7::uuid[]
      )`,
      [applicationId, `Local ${slug}`, slug, status, kind, `${slug}@phase05.test`, [categoryId]],
    ),
  );
}

async function decide(userId: string, applicationId: string, status: string, message = "", note = "") {
  await act(userId, (query) =>
    query("select public.decide_business_application($1::uuid, $2::public.application_status, $3, $4)", [
      applicationId,
      status,
      message,
      note,
    ]),
  );
}

async function applicationStatus(applicationId: string) {
  const result = await admin("select status from public.business_applications where id = $1", [applicationId]);
  return String(result.rows[0].status);
}

async function businessIdFor(applicationId: string) {
  const result = await admin("select business_id from public.business_applications where id = $1", [applicationId]);
  return String(result.rows[0].business_id);
}

async function createProduct(userId: string, businessId: string, slug: string) {
  const result = await act(userId, (query) =>
    query(
      `select public.create_producer_product(
        $1::uuid, $2::uuid, $3, $4, 'Short summary', 'Disposable local product description', null, null, null, 'UG', null
      ) as id`,
      [businessId, categoryId, `Local ${slug}`, slug],
    ),
  );
  return String(result.rows[0].id);
}

async function rest(token: string | null, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", env.anonKey);
  headers.set("accept", "application/json");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${env.apiUrl}/rest/v1/${path}`, { ...init, headers });
  const text = await response.text();
  return { status: response.status, text };
}

async function storage(token: string | null, method: string, path: string, body?: BodyInit, contentType?: string) {
  const headers = new Headers();
  headers.set("apikey", env.anonKey);
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const response = await fetch(`${env.apiUrl}/storage/v1/${path}`, { method, headers, body });
  const text = await response.text();
  return { status: response.status, text };
}

async function removeStorage(bucket: string, prefix = "") {
  const response = await fetch(`${env.apiUrl}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: env.serviceRoleKey,
      authorization: `Bearer ${env.serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
  });
  if (!response.ok) {
    return;
  }
  const rows = (await response.json()) as Array<{ name?: string; id?: string | null }>;
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }
  const files = rows.filter((row) => row.id && row.name).map((row) => (prefix ? `${prefix}/${row.name}` : row.name ?? ""));
  const folders = rows.filter((row) => !row.id && row.name).map((row) => (prefix ? `${prefix}/${row.name}` : row.name ?? ""));
  if (files.length > 0) {
    await fetch(`${env.apiUrl}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: {
        apikey: env.serviceRoleKey,
        authorization: `Bearer ${env.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefixes: files }),
    });
  }
  for (const folder of folders) {
    await removeStorage(bucket, folder);
  }
}

async function removeFixtures() {
  await removeStorage("product-images");
  await removeStorage("business-documents");
  await admin("alter table public.business_application_events disable trigger business_application_events_immutable");
  await admin("alter table public.business_application_internal_notes disable trigger business_application_notes_immutable");
  try {
  await admin(`
    delete from public.product_images
    where product_id in (
      select id from public.products
      where business_id in (select id from public.businesses where slug like 'phase05-%')
    )
  `);
  await admin("delete from public.products where slug like 'phase05-%' or business_id in (select id from public.businesses where slug like 'phase05-%')");
  await admin("delete from public.business_application_documents where application_id in (select id from public.business_applications where business_id in (select id from public.businesses where slug like 'phase05-%'))");
  await admin("delete from public.business_document_orphans where reported_by in (select id from auth.users where email like '%@phase05.test')");
  await admin("delete from public.product_image_orphans where reported_by in (select id from auth.users where email like '%@phase05.test')");
  await admin("delete from public.business_application_internal_notes where application_id in (select id from public.business_applications where business_id in (select id from public.businesses where slug like 'phase05-%'))");
  await admin("delete from public.business_application_events where application_id in (select id from public.business_applications where business_id in (select id from public.businesses where slug like 'phase05-%'))");
  await admin("delete from public.business_application_categories where application_id in (select id from public.business_applications where business_id in (select id from public.businesses where slug like 'phase05-%'))");
  await admin("delete from public.business_applications where business_id in (select id from public.businesses where slug like 'phase05-%')");
  await admin("delete from public.business_members where business_id in (select id from public.businesses where slug like 'phase05-%')");
  await admin("delete from public.businesses where slug like 'phase05-%'");
  await admin("delete from public.categories where slug like 'phase05-%'");
  await admin("delete from auth.users where email like '%@phase05.test'");
  } finally {
    await admin("alter table public.business_application_events enable trigger business_application_events_immutable");
    await admin("alter table public.business_application_internal_notes enable trigger business_application_notes_immutable");
  }
}

describe("local database authorization", { concurrency: 1 }, () => {
  before(async () => {
    env = readLocalSupabase();
    pool = new Pool({ connectionString: env.dbUrl, max: 6, statement_timeout: 15000 });
    await removeFixtures();
    const category = await admin("select id from public.categories where is_active = true order by display_order, name limit 1");
    categoryId = String(category.rows[0].id);
    const inactive = await admin(
      "insert into public.categories (name, slug, description, is_active) values ('Local inactive', 'phase05-inactive', 'Inactive local category.', false) returning id",
    );
    inactiveCategoryId = String(inactive.rows[0].id);

    const people = [
      ["applicant-a", "Applicant A"],
      ["applicant-b", "Applicant B"],
      ["producer-a", "Producer A"],
      ["producer-b", "Producer B"],
      ["pending-producer", "Pending Producer"],
      ["rejected-applicant", "Rejected Applicant"],
      ["suspended-producer", "Suspended Producer"],
      ["manufacturer", "Manufacturer Owner"],
      ["reviewer", "Reviewer One"],
      ["reviewer-applicant", "Reviewer Applicant"],
    ] as const;
    for (const [key, name] of people) {
      await createUser(key, name);
    }
    await admin("insert into public.user_roles (user_id, role) values ($1, 'reviewer'), ($2, 'reviewer')", [
      ids.reviewer.id,
      ids["reviewer-applicant"].id,
    ]);

    apps.applicantA = await startApplication(ids["applicant-a"].id, "phase05-applicant-a");
    apps.applicantB = await startApplication(ids["applicant-b"].id, "phase05-applicant-b");
    apps.producerA = await startApplication(ids["producer-a"].id, "phase05-producer-a");
    apps.producerB = await startApplication(ids["producer-b"].id, "phase05-producer-b");
    apps.pending = await startApplication(ids["pending-producer"].id, "phase05-pending");
    apps.rejected = await startApplication(ids["rejected-applicant"].id, "phase05-rejected");
    apps.suspended = await startApplication(ids["suspended-producer"].id, "phase05-suspended");
    apps.manufacturer = await startApplication(ids.manufacturer.id, "phase05-manufacturer");
    apps.reviewerOwn = await startApplication(ids["reviewer-applicant"].id, "phase05-reviewer-own");
    apps.withdraw = await startApplication(ids["applicant-a"].id, "phase05-withdraw");
    apps.rollback = await startApplication(ids["applicant-a"].id, "phase05-rollback");
    apps.conflict = await startApplication(ids["applicant-a"].id, "phase05-conflict");
    apps.info = await startApplication(ids["applicant-b"].id, "phase05-info");

    for (const [key, kind] of [
      ["producerA", "producer"],
      ["producerB", "producer"],
      ["pending", "producer"],
      ["rejected", "producer"],
      ["suspended", "producer"],
      ["manufacturer", "manufacturer"],
      ["reviewerOwn", "producer"],
      ["withdraw", "producer"],
      ["conflict", "producer"],
      ["info", "producer"],
    ] as const) {
      const owner =
        key === "producerA"
          ? ids["producer-a"].id
          : key === "producerB"
            ? ids["producer-b"].id
            : key === "pending"
              ? ids["pending-producer"].id
              : key === "rejected"
                ? ids["rejected-applicant"].id
                : key === "suspended"
                  ? ids["suspended-producer"].id
                  : key === "manufacturer"
                    ? ids.manufacturer.id
                    : key === "reviewerOwn"
                      ? ids["reviewer-applicant"].id
                      : key === "info"
                        ? ids["applicant-b"].id
                        : ids["applicant-a"].id;
      await saveApplication(owner, apps[key], `phase05-${key === "producerA" ? "producer-a" : key === "producerB" ? "producer-b" : key === "reviewerOwn" ? "reviewer-own" : key}`, "submitted", kind);
    }

    for (const key of ["producerA", "producerB", "rejected", "suspended", "manufacturer"] as const) {
      await decide(ids.reviewer.id, apps[key], key === "rejected" ? "rejected" : "approved", "Decision recorded", "Internal decision note");
    }

    for (const key of ["producerA", "producerB", "pending", "suspended", "manufacturer"] as const) {
      businesses[key] = await businessIdFor(apps[key]);
    }
    products.published = await createProduct(ids["producer-a"].id, businesses.producerA, "phase05-published");
    products.draft = await createProduct(ids["producer-a"].id, businesses.producerA, "phase05-draft");
    products.archived = await createProduct(ids["producer-a"].id, businesses.producerA, "phase05-archived");
    products.suspended = await createProduct(ids["suspended-producer"].id, businesses.suspended, "phase05-was-published");
    await act(ids["producer-a"].id, (query) =>
      query("select public.set_producer_product_status($1::uuid, 'published'::public.product_publication_status)", [products.published]),
    );
    await act(ids["producer-a"].id, (query) =>
      query("select public.set_producer_product_status($1::uuid, 'archived'::public.product_publication_status)", [products.archived]),
    );
    await act(ids["suspended-producer"].id, (query) =>
      query("select public.set_producer_product_status($1::uuid, 'published'::public.product_publication_status)", [products.suspended]),
    );
    await admin("update public.businesses set approval_status = 'suspended' where slug = 'phase05-suspended'");
    await admin(
      `insert into public.products (business_id, category_id, name, slug, publication_status, published_at)
       values ($1, $2, 'Hidden inactive', 'phase05-inactive-product', 'published', now())`,
      [businesses.producerA, inactiveCategoryId],
    );
    await admin(
      `insert into public.products (business_id, category_id, name, slug, publication_status, published_at)
       values ($1, $2, 'Hidden pending', 'phase05-pending-product', 'published', now())`,
      [businesses.pending, categoryId],
    );
  });

  after(async () => {
    await admin("alter table public.business_application_events drop constraint if exists phase05_force_fail");
    await removeFixtures();
    await pool.end();
  });

  it("applied every local migration", async () => {
    const result = await admin("select version from supabase_migrations.schema_migrations order by version");
    assert.deepEqual(
      result.rows.map((row) => row.version),
      [
        "20261119095711",
        "20261119113107",
        "20261119124504",
        "20261119124532",
        "20261119131559",
        "20261119140843",
      ],
    );
  });

  it("keeps both storage buckets private", async () => {
    const result = await admin("select id, public from storage.buckets order by id");
    assert.deepEqual(result.rows, [
      { id: "business-documents", public: false },
      { id: "product-images", public: false },
    ]);
  });

  it("rejects a category cycle longer than a self-parent", async () => {
    const first = await admin(
      "insert into public.categories (name, slug, description) values ('Cycle A', 'phase05-cycle-a', 'Cycle check.') returning id",
    );
    const second = await admin(
      "insert into public.categories (name, slug, description, parent_id) values ('Cycle B', 'phase05-cycle-b', 'Cycle check.', $1) returning id",
      [first.rows[0].id],
    );
    const third = await admin(
      "insert into public.categories (name, slug, description, parent_id) values ('Cycle C', 'phase05-cycle-c', 'Cycle check.', $1) returning id",
      [second.rows[0].id],
    );
    await assert.rejects(
      () => admin("update public.categories set parent_id = $2 where id = $1", [first.rows[0].id, third.rows[0].id]),
      /category parent would create a cycle/,
    );
    await assert.rejects(
      () => admin("update public.categories set parent_id = id where id = $1", [second.rows[0].id]),
      /category parent would create a cycle|categories_parent_not_self/,
    );
  });

  it("shows anonymous visitors only a fully published catalogue row", async () => {
    const visible = await act(null, (query) => query("select current_user as actor, slug from public.products order by slug"));
    assert.deepEqual(
      visible.rows.map((row) => `${row.actor}:${row.slug}`),
      ["anon:phase05-published"],
    );
    const businessesSeen = await act(null, (query) => query("select slug from public.businesses order by slug"));
    assert.deepEqual(businessesSeen.rows.map((row) => row.slug), ["phase05-manufacturer", "phase05-producer-a", "phase05-producer-b"]);
    const hiddenImages = await act(null, (query) =>
      query(
        `select storage_path from public.product_images
         where product_id in (select id from public.products where slug = 'phase05-draft')`,
      ),
    );
    assert.equal(hiddenImages.rowCount, 0);
    await expectFailure(null, (query) => query("select contact_email from public.businesses"), /permission denied/);
    await expectFailure(null, (query) => query("select created_by from public.businesses"), /permission denied/);
  });

  it("lets an applicant read and edit only their own open application", async () => {
    const own = await act(ids["applicant-a"].id, (query) => query("select id from public.business_applications where id = $1", [apps.applicantA]));
    assert.equal(own.rowCount, 1);
    const other = await act(ids["applicant-a"].id, (query) => query("select id from public.business_applications where id = $1", [apps.applicantB]));
    assert.equal(other.rowCount, 0);
    await expectFailure(
      ids["applicant-a"].id,
      (query) => query("select public.save_business_application($1::uuid, 'Stolen', 'phase05-applicant-b', 'draft'::public.application_status, 'producer'::public.business_kind, 'Nope', null, null, null, null, null, null, null, null, 'not_required'::public.registration_standing, null, null, null, null, null, null, null, null, null, false, false, false, null)", [apps.applicantB]),
      /application was not found/,
    );
    await expectFailure(
      ids["applicant-a"].id,
      (query) => query("select public.save_business_application($1::uuid, 'Bad status', 'phase05-applicant-a', 'approved'::public.application_status, 'producer'::public.business_kind, 'Disposable local verification description.', 'UG', null, null, null, null, 'a@phase05.test', '0700000001', null, 'not_required'::public.registration_standing, null, null, null, null, null, null, null, 1, 'Owner', true, true, true, $2::uuid[])", [apps.applicantA, [categoryId]]),
      /that status change is not available/,
    );
    assert.equal(await applicationStatus(apps.applicantA), "draft");
    await expectFailure(
      ids["applicant-a"].id,
      (query) => query("select public.decide_business_application($1::uuid, 'approved'::public.application_status, 'no', 'no')", [apps.pending]),
      /reviewer role is required/,
    );
  });

  it("hides reviewer notes and blocks history changes", async () => {
    const notes = await act(ids["applicant-a"].id, (query) => query("select id from public.business_application_internal_notes"));
    assert.equal(notes.rowCount, 0);
    const reviewerNotes = await act(ids.reviewer.id, (query) => query("select body from public.business_application_internal_notes"));
    assert.ok((reviewerNotes.rowCount ?? 0) > 0);
    await expectFailure(
      ids.reviewer.id,
      (query) => query("update public.business_application_internal_notes set body = 'changed'"),
      /permission denied|application history cannot be changed/,
    );
    await expectFailure(
      ids.reviewer.id,
      (query) => query("delete from public.business_application_events"),
      /permission denied|application history cannot be changed/,
    );
    const unchanged = await admin("select count(*) from public.business_application_internal_notes where body = 'changed'");
    assert.equal(Number(unchanged.rows[0].count), 0);
  });

  it("rejects illegal review transitions, self-approval, and a repeated decision", async () => {
    await expectFailure(
      ids["reviewer-applicant"].id,
      (query) => query("select public.decide_business_application($1::uuid, 'approved'::public.application_status, 'self', 'self note')", [apps.reviewerOwn]),
      /you cannot decide your own application/,
    );
    assert.equal(await applicationStatus(apps.reviewerOwn), "submitted");
    const selfNotes = await admin("select count(*) from public.business_application_internal_notes where body = 'self note'");
    assert.equal(Number(selfNotes.rows[0].count), 0);
    await expectFailure(
      ids.reviewer.id,
      (query) => query("select public.decide_business_application($1::uuid, 'approved'::public.application_status, 'too soon', 'too soon')", [apps.applicantA]),
      /that status change is not available/,
    );
    await expectFailure(
      ids.reviewer.id,
      (query) => query("select public.decide_business_application($1::uuid, 'approved'::public.application_status, 'again', 'duplicate note')", [apps.producerA]),
      /that status change is not available/,
    );
    const duplicate = await admin("select count(*) from public.business_application_internal_notes where body = 'duplicate note'");
    assert.equal(Number(duplicate.rows[0].count), 0);
    await expectFailure(
      ids["applicant-a"].id,
      (query) => query("insert into public.user_roles (user_id, role) values ($1, 'reviewer')", [ids["applicant-a"].id]),
      /permission denied/,
    );
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("update public.businesses set approval_status = 'suspended' where id = $1", [businesses.producerA]),
      /permission denied/,
    );
  });

  it("rolls back a save when a later category check fails", async () => {
    await saveApplication(ids["applicant-a"].id, apps.rollback, "phase05-rollback", "draft");
    await expectFailure(
      ids["applicant-a"].id,
      (query) =>
        query(
          `select public.save_business_application(
            p_application_id => $1::uuid, p_display_name => 'Changed Name', p_slug => 'phase05-rollback',
            p_status => 'draft'::public.application_status, p_business_kind => 'producer'::public.business_kind,
            p_description => 'Disposable local verification description.', p_country_code => 'UG', p_district => null,
            p_city => null, p_address => null, p_website => null, p_business_email => 'rollback@phase05.test',
            p_business_phone => '0700000001', p_whatsapp_phone => null,
            p_registration_standing => 'not_required'::public.registration_standing,
            p_registration_authority => null, p_registration_number => null, p_tax_identification => null,
            p_main_offerings => null, p_activities => null, p_regions_served => null, p_operations_summary => null,
            p_years_operating => 1, p_applicant_position => 'Owner', p_authorised => true, p_accuracy => true,
            p_consent => true, p_category_ids => $2::uuid[]
          )`,
          [apps.rollback, [randomUUID()]],
        ),
      /a category is not active/,
    );
    const name = await admin("select display_name from public.businesses where slug = 'phase05-rollback'");
    assert.equal(name.rows[0].display_name, "Local phase05-rollback");
  });

  it("rolls back a review when the history insert fails", async () => {
    await admin(
      "alter table public.business_application_events add constraint phase05_force_fail check (applicant_message is distinct from 'FORCE_FAIL')",
    );
    try {
      await expectFailure(
        ids.reviewer.id,
        (query) => query("select public.decide_business_application($1::uuid, 'under_review'::public.application_status, 'FORCE_FAIL', 'should vanish')", [apps.conflict]),
        /phase05_force_fail|check constraint/,
      );
    } finally {
      await admin("alter table public.business_application_events drop constraint if exists phase05_force_fail");
    }
    assert.equal(await applicationStatus(apps.conflict), "submitted");
    const note = await admin("select count(*) from public.business_application_internal_notes where body = 'should vanish'");
    assert.equal(Number(note.rows[0].count), 0);
  });

  it("keeps one result when two reviewers decide at the same time", async () => {
    const open = async (userId: string) => {
      const client = new Client({ connectionString: env.dbUrl, statement_timeout: 15000 });
      await client.connect();
      await client.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
      await client.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
      await client.query("set role authenticated");
      return client;
    };
    const left = await open(ids.reviewer.id);
    const right = await open(ids["reviewer-applicant"].id);
    let results: PromiseSettledResult<QueryResult>[] = [];
    try {
      results = await Promise.allSettled([
        left.query("select public.decide_business_application($1::uuid, 'approved'::public.application_status, 'left', 'left note')", [apps.info]),
        right.query("select public.decide_business_application($1::uuid, 'rejected'::public.application_status, 'right', 'right note')", [apps.info]),
      ]);
    } finally {
      await left.end();
      await right.end();
    }
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    const status = await applicationStatus(apps.info);
    assert.ok(status === "approved" || status === "rejected");
    const events = await admin(
      "select event::text from public.business_application_events where application_id = $1 and event in ('approved', 'rejected')",
      [apps.info],
    );
    assert.equal(events.rowCount, 1);
    assert.equal(events.rows[0].event, status);
  });

  it("withdraws an open application and refuses to revive it", async () => {
    await act(ids["applicant-a"].id, (query) => query("select public.withdraw_business_application($1::uuid)", [apps.withdraw]));
    assert.equal(await applicationStatus(apps.withdraw), "withdrawn");
    await expectFailure(
      ids["applicant-a"].id,
      (query) => query("select public.save_business_application($1::uuid, 'Revive', 'phase05-withdraw', 'submitted'::public.application_status, 'producer'::public.business_kind, 'Disposable local verification description.', 'UG', null, null, null, null, 'w@phase05.test', '0700000001', null, 'not_required'::public.registration_standing, null, null, null, null, null, null, null, 1, 'Owner', true, true, true, $2::uuid[])", [apps.withdraw, [categoryId]]),
      /this application cannot be edited|that status change is not available/,
    );
    assert.equal(await applicationStatus(apps.withdraw), "withdrawn");
  });

  it("requests information and lets only the applicant resubmit", async () => {
    await decide(ids.reviewer.id, apps.pending, "information_requested", "Please add the district", "Ask for the district");
    assert.equal(await applicationStatus(apps.pending), "information_requested");
    const approval = await admin("select approval_status from public.businesses where slug = 'phase05-pending'");
    assert.equal(approval.rows[0].approval_status, "pending");
    await saveApplication(ids["pending-producer"].id, apps.pending, "phase05-pending", "submitted");
    assert.equal(await applicationStatus(apps.pending), "submitted");
    const event = await admin(
      "select event::text from public.business_application_events where application_id = $1 and event = 'resubmitted'",
      [apps.pending],
    );
    assert.equal(event.rowCount, 1);
  });

  it("isolates producer products and blocks direct publication writes", async () => {
    const ownDraft = await act(ids["producer-a"].id, (query) => query("select slug from public.products where slug = 'phase05-draft'"));
    assert.equal(ownDraft.rowCount, 1);
    const foreignDraft = await act(ids["producer-b"].id, (query) => query("select slug from public.products where slug = 'phase05-draft'"));
    assert.equal(foreignDraft.rowCount, 0);
    await expectFailure(
      ids["producer-b"].id,
      (query) =>
        query("select public.update_producer_product($1::uuid, $2::uuid, 'Stolen', 'phase05-draft', 'Short', 'Body', null, null, null, 'UG', null)", [
          products.draft,
          categoryId,
        ]),
      /not a member of this business/,
    );
    await expectFailure(
      ids["producer-b"].id,
      (query) => query("select public.set_producer_product_status($1::uuid, 'published'::public.product_publication_status)", [products.draft]),
      /not a member of this business/,
    );
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("insert into public.products (business_id, category_id, name, slug) values ($1, $2, 'Direct', 'phase05-direct')", [businesses.producerA, categoryId]),
      /permission denied/,
    );
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("update public.products set publication_status = 'published' where id = $1", [products.draft]),
      /permission denied/,
    );
    await expectFailure(
      ids["pending-producer"].id,
      (query) => query("select public.create_producer_product($1::uuid, $2::uuid, 'Nope', 'phase05-no-pending', 'Short', 'Body', null, null, null, 'UG', null)", [businesses.pending, categoryId]),
      /business is not approved/,
    );
    await expectFailure(
      ids["suspended-producer"].id,
      (query) => query("select public.update_producer_storefront($1::uuid, 'Suspended', 'Text', 'UG', 'Kampala', null, null, null, null)", [businesses.suspended]),
      /business is not approved|not a member/,
    );
    await expectFailure(
      ids.manufacturer.id,
      (query) => query("select public.create_producer_product($1::uuid, $2::uuid, 'Nope', 'phase05-no-manufacturer', 'Short', 'Body', null, null, null, 'UG', null)", [businesses.manufacturer, categoryId]),
      /this workspace is only for producers/,
    );
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("select public.create_producer_product($1::uuid, $2::uuid, 'Inactive', 'phase05-no-inactive', 'Short', 'Body', null, null, null, 'UG', null)", [businesses.producerA, inactiveCategoryId]),
      /category is not active/,
    );
    const stillDraft = await admin("select publication_status from public.products where id = $1", [products.draft]);
    assert.equal(stillDraft.rows[0].publication_status, "draft");
    const approval = await admin("select approval_status from public.businesses where id = $1", [businesses.producerA]);
    assert.equal(approval.rows[0].approval_status, "approved");
  });

  it("follows the product publication transitions", async () => {
    await act(ids["producer-a"].id, (query) =>
      query("select public.set_producer_product_status($1::uuid, 'published'::public.product_publication_status)", [products.draft]),
    );
    await act(ids["producer-a"].id, (query) =>
      query("select public.set_producer_product_status($1::uuid, 'draft'::public.product_publication_status)", [products.draft]),
    );
    const row = await admin("select publication_status, published_at is not null as had_published from public.products where id = $1", [products.draft]);
    assert.equal(row.rows[0].publication_status, "draft");
    assert.equal(row.rows[0].had_published, true);
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("select public.set_producer_product_status($1::uuid, 'published'::public.product_publication_status)", [products.archived]),
      /status change is not allowed/,
    );
    const archived = await admin("select publication_status from public.products where id = $1", [products.archived]);
    assert.equal(archived.rows[0].publication_status, "archived");
  });

  it("enforces the same denials through the HTTP API", async () => {
    const anonPublished = await rest(null, "products?select=slug&slug=eq.phase05-published");
    assert.equal(anonPublished.status, 200);
    assert.match(anonPublished.text, /phase05-published/);
    const anonDraft = await rest(null, "products?select=slug&slug=eq.phase05-draft");
    assert.equal(anonDraft.text, "[]");
    const anonArchived = await rest(null, "products?select=slug&slug=eq.phase05-archived");
    assert.equal(anonArchived.text, "[]");
    const anonInactive = await rest(null, "products?select=slug&slug=eq.phase05-inactive-product");
    assert.equal(anonInactive.text, "[]");
    const anonPending = await rest(null, "products?select=slug&slug=eq.phase05-pending-product");
    assert.equal(anonPending.text, "[]");
    const contact = await rest(null, "businesses?select=contact_email&slug=eq.phase05-producer-a");
    assert.ok(contact.status >= 400, contact.text);
    const createdBy = await rest(null, "businesses?select=created_by&slug=eq.phase05-producer-a");
    assert.ok(createdBy.status >= 400, createdBy.text);
    const ownApplications = await rest(ids["applicant-a"].token, "business_applications?select=id");
    assert.equal(ownApplications.status, 200);
    assert.match(ownApplications.text, new RegExp(apps.applicantA));
    assert.doesNotMatch(ownApplications.text, new RegExp(apps.applicantB));
    const foreignDecision = await rest(ids["producer-b"].token, "rpc/set_producer_product_status", {
      method: "POST",
      body: JSON.stringify({ p_product_id: products.draft, p_status: "published" }),
    });
    assert.ok(foreignDecision.status >= 400);
    assert.match(foreignDecision.text, /not a member of this business/);
    const still = await admin("select publication_status from public.products where id = $1", [products.draft]);
    assert.equal(still.rows[0].publication_status, "draft");
  });

  it("stores private documents only for the owning open application", async () => {
    const objectId = randomUUID();
    const ownPath = `${ids["applicant-a"].id}/${apps.applicantA}/${objectId}.pdf`;
    const pdf = Buffer.from("%PDF-1.4\n%phase05\n");
    const uploaded = await storage(ids["applicant-a"].token, "POST", `object/business-documents/${ownPath}`, pdf, "application/pdf");
    assert.equal(uploaded.status, 200, uploaded.text);
    const intruder = await storage(
      ids["applicant-b"].token,
      "POST",
      `object/business-documents/${ids["applicant-a"].id}/${apps.applicantA}/${randomUUID()}.pdf`,
      pdf,
      "application/pdf",
    );
    assert.ok(intruder.status >= 400);
    const anonymous = await storage(null, "GET", `object/business-documents/${ownPath}`);
    assert.ok(anonymous.status >= 400);
    const beforeRow = await storage(ids.reviewer.token, "GET", `object/business-documents/${ownPath}`);
    assert.ok(beforeRow.status >= 400);
    await act(ids["applicant-a"].id, (query) =>
      query(
        `insert into public.business_application_documents (application_id, storage_path, file_name, mime_type, size_bytes, uploaded_by)
         values ($1, $2, 'local.pdf', 'application/pdf', $3, $4)`,
        [apps.applicantA, ownPath, pdf.length, ids["applicant-a"].id],
      ),
    );
    const reviewerRead = await storage(ids.reviewer.token, "GET", `object/business-documents/${ownPath}`);
    assert.equal(reviewerRead.status, 200);
    const otherRead = await storage(ids["applicant-b"].token, "GET", `object/business-documents/${ownPath}`);
    assert.ok(otherRead.status >= 400);
    const html = await storage(ids["applicant-a"].token, "POST", `object/business-documents/${ids["applicant-a"].id}/${apps.applicantA}/${randomUUID()}.html`, Buffer.from("<html></html>"), "text/html");
    assert.ok(html.status >= 400);
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1, 0x25);
    oversized.set(Buffer.from("%PDF"), 0);
    const tooBig = await storage(
      ids["applicant-a"].token,
      "POST",
      `object/business-documents/${ids["applicant-a"].id}/${apps.applicantA}/${randomUUID()}.pdf`,
      oversized,
      "application/pdf",
    );
    assert.ok(tooBig.status >= 400);
    const closed = await storage(
      ids["producer-a"].token,
      "POST",
      `object/business-documents/${ids["producer-a"].id}/${apps.producerA}/${randomUUID()}.pdf`,
      pdf,
      "application/pdf",
    );
    assert.ok(closed.status >= 400);
    await act(ids["applicant-a"].id, (query) =>
      query(
        "insert into public.business_document_orphans (storage_path, application_id, reported_by, reason) values ($1, $2, $3, 'cleanup failed')",
        [`${ids["applicant-a"].id}/${apps.applicantA}/${randomUUID()}.pdf`, apps.applicantA, ids["applicant-a"].id],
      ),
    );
    const ownOrphan = await act(ids["applicant-a"].id, (query) => query("select id from public.business_document_orphans"));
    assert.equal(ownOrphan.rowCount, 1);
    const hiddenOrphan = await act(ids["applicant-b"].id, (query) => query("select id from public.business_document_orphans"));
    assert.equal(hiddenOrphan.rowCount, 0);
  });

  it("stores product images only for the approved producer who manages the product", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = Buffer.alloc(12);
    webp.set(Buffer.from("RIFF"), 0);
    webp.set(Buffer.from("WEBP"), 8);
    const pathFor = (productId: string) => `${businesses.producerA}/${productId}/${randomUUID()}`;
    const jpegPath = `${pathFor(products.draft)}.jpg`;
    const uploaded = await storage(ids["producer-a"].token, "POST", `object/product-images/${jpegPath}`, jpeg, "image/jpeg");
    assert.equal(uploaded.status, 200, uploaded.text);
    const pngPath = `${pathFor(products.draft)}.png`;
    const pngUpload = await storage(ids["producer-a"].token, "POST", `object/product-images/${pngPath}`, png, "image/png");
    assert.equal(pngUpload.status, 200, pngUpload.text);
    const webpPath = `${pathFor(products.draft)}.webp`;
    const webpUpload = await storage(ids["producer-a"].token, "POST", `object/product-images/${webpPath}`, webp, "image/webp");
    assert.equal(webpUpload.status, 200, webpUpload.text);
    const stolen = await storage(ids["producer-b"].token, "POST", `object/product-images/${pathFor(products.draft)}.jpg`, jpeg, "image/jpeg");
    assert.ok(stolen.status >= 400, stolen.text);
    const html = await storage(ids["producer-a"].token, "POST", `object/product-images/${pathFor(products.draft)}.jpg`, Buffer.from("<html></html>"), "text/html");
    assert.ok(html.status >= 400);
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    const tooBig = await storage(ids["producer-a"].token, "POST", `object/product-images/${pathFor(products.draft)}.jpg`, oversized, "image/jpeg");
    assert.ok(tooBig.status >= 400);
    const attached = await act(ids["producer-a"].id, (query) =>
      query("select public.attach_product_image($1::uuid, $2, 'Local image') as id", [products.draft, jpegPath]),
    );
    const imageId = String(attached.rows[0].id);
    const anonObject = await storage(null, "GET", `object/product-images/${jpegPath}`);
    assert.ok(anonObject.status >= 400);
    const ownerObject = await storage(ids["producer-a"].token, "GET", `object/product-images/${jpegPath}`);
    assert.equal(ownerObject.status, 200);
    const signed = await storage(ids["producer-a"].token, "POST", `object/sign/product-images/${jpegPath}`, JSON.stringify({ expiresIn: 60 }), "application/json");
    assert.equal(signed.status, 200, signed.text);
    const signedBody = JSON.parse(signed.text) as { signedURL?: string; signedUrl?: string };
    const signedPath = signedBody.signedURL ?? signedBody.signedUrl ?? "";
    assert.match(signedPath, /sign/i);
    const signedRead = await fetch(signedPath.startsWith("http") ? signedPath : `${env.apiUrl}/storage/v1${signedPath}`);
    assert.equal(signedRead.status, 200);
    await expectFailure(
      ids["producer-b"].id,
      (query) => query("select public.remove_product_image($1::uuid)", [imageId]),
      /not a member of this business|image was not found/,
    );
    const removedPath = await act(ids["producer-a"].id, (query) => query("select public.remove_product_image($1::uuid) as path", [imageId]));
    assert.equal(removedPath.rows[0].path, jpegPath);
    const deleted = await storage(ids["producer-a"].token, "DELETE", "object/product-images", JSON.stringify({ prefixes: [jpegPath] }), "application/json");
    assert.ok(deleted.status < 400, deleted.text);
    const orphanPath = `${pathFor(products.draft)}.jpg`;
    const orphanUpload = await storage(ids["producer-a"].token, "POST", `object/product-images/${orphanPath}`, jpeg, "image/jpeg");
    assert.equal(orphanUpload.status, 200, orphanUpload.text);
    await expectFailure(
      ids["producer-a"].id,
      (query) => query("select public.attach_product_image($1::uuid, $2, '')", [products.draft, orphanPath]),
      /product_images_alt_text_length|alt/,
    );
    const noRow = await admin("select count(*) from public.product_images where storage_path = $1", [orphanPath]);
    assert.equal(Number(noRow.rows[0].count), 0);
    await act(ids["producer-a"].id, (query) =>
      query(
        "insert into public.product_image_orphans (storage_path, product_id, reported_by, reason) values ($1, $2, $3, 'cleanup failed')",
        [orphanPath, products.draft, ids["producer-a"].id],
      ),
    );
    const ownOrphan = await act(ids["producer-a"].id, (query) => query("select id from public.product_image_orphans where storage_path = $1", [orphanPath]));
    assert.equal(ownOrphan.rowCount, 1);
    const otherOrphan = await act(ids["producer-b"].id, (query) => query("select id from public.product_image_orphans where storage_path = $1", [orphanPath]));
    assert.equal(otherOrphan.rowCount, 0);
    const cleaned = await storage(ids["producer-a"].token, "DELETE", "object/product-images", JSON.stringify({ prefixes: [orphanPath] }), "application/json");
    assert.ok(cleaned.status < 400, cleaned.text);
  });

  it("captures local authentication mail without echoing secrets", async () => {
    const email = "signup@phase05.test";
    const created = await fetch(`${env.apiUrl}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password, data: { full_name: "Signup Person", terms_accepted: "true" } }),
    });
    assert.equal(created.status, 200, await created.text());
    const duplicate = await fetch(`${env.apiUrl}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password, data: { full_name: "Signup Person", terms_accepted: "true" } }),
    });
    const duplicateText = await duplicate.text();
    assert.ok(duplicate.status >= 400);
    assert.doesNotMatch(duplicateText, /service_role|sb_secret|eyJ/);
    const early = await fetch(`${env.apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.ok(early.status >= 400);
    const wrong = await fetch(`${env.apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email: ids["applicant-a"].email, password: "not-the-password" }),
    });
    const wrongText = await wrong.text();
    assert.ok(wrong.status >= 400);
    assert.doesNotMatch(wrongText, /service_role|sb_secret/);
    const deadline = Date.now() + 8000;
    let mailText = "";
    while (Date.now() < deadline && !mailText) {
      const list = await fetch(`${env.mailUrl}/api/v1/messages`);
      const listing = (await list.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
      const message = (listing.messages ?? []).find((item) => item.To?.some((to) => to.Address === email));
      if (message) {
        const full = await fetch(`${env.mailUrl}/api/v1/message/${message.ID}`);
        const body = (await full.json()) as { Text?: string; HTML?: string };
        mailText = `${body.Text ?? ""}\n${body.HTML ?? ""}`;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    assert.match(mailText, /token|verify|confirm/i);
    const tokenHash = /token_hash=([^&"'\s]+)/.exec(mailText)?.[1];
    const token = /[?&]token=([^&"'\s]+)/.exec(mailText)?.[1];
    const verify = tokenHash
      ? await fetch(`${env.apiUrl}/auth/v1/verify`, {
          method: "POST",
          headers: { apikey: env.anonKey, "content-type": "application/json" },
          body: JSON.stringify({ type: "signup", token_hash: decodeURIComponent(tokenHash) }),
        })
      : await fetch(`${env.apiUrl}/auth/v1/verify?token=${token}&type=signup`, {
          headers: { apikey: env.anonKey },
          redirect: "manual",
        });
    assert.ok(verify.status >= 200 && verify.status < 400, `${verify.status}`);
    const session = await signIn(email);
    const user = await fetch(`${env.apiUrl}/auth/v1/user`, { headers: { apikey: env.anonKey, authorization: `Bearer ${session}` } });
    assert.equal(user.status, 200);
    const signedOut = await fetch(`${env.apiUrl}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: env.anonKey, authorization: `Bearer ${session}` },
    });
    assert.ok(signedOut.status < 300);
    const afterLogout = await fetch(`${env.apiUrl}/auth/v1/user`, { headers: { apikey: env.anonKey, authorization: `Bearer ${session}` } });
    assert.ok(afterLogout.status >= 400);
    const reset = await fetch(`${env.apiUrl}/auth/v1/recover`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    assert.ok(reset.ok, await reset.text());
    let resetText = "";
    const resetDeadline = Date.now() + 8000;
    while (Date.now() < resetDeadline && !resetText.includes("recovery")) {
      const list = await fetch(`${env.mailUrl}/api/v1/messages`);
      const listing = (await list.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
      const message = (listing.messages ?? []).find((item) => item.To?.some((to) => to.Address === email));
      if (message) {
        const full = await fetch(`${env.mailUrl}/api/v1/message/${message.ID}`);
        const body = (await full.json()) as { Text?: string; HTML?: string };
        const text = `${body.Text ?? ""}\n${body.HTML ?? ""}`;
        if (text.includes("recovery") || text.includes("reset")) {
          resetText = text;
        }
      }
      if (!resetText) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    assert.match(resetText, /recovery|reset/i);
    const resetHash = /token_hash=([^&"'\s]+)/.exec(resetText)?.[1];
    const expired = await fetch(`${env.apiUrl}/auth/v1/verify`, {
      method: "POST",
      headers: { apikey: env.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ type: "recovery", token_hash: "not-a-real-token" }),
    });
    assert.ok(expired.status >= 400);
    if (resetHash) {
      const verified = await fetch(`${env.apiUrl}/auth/v1/verify`, {
        method: "POST",
        headers: { apikey: env.anonKey, "content-type": "application/json" },
        body: JSON.stringify({ type: "recovery", token_hash: decodeURIComponent(resetHash) }),
      });
      const verifiedBody = (await verified.json()) as { access_token?: string };
      assert.ok(verified.ok && verifiedBody.access_token, JSON.stringify(verifiedBody).slice(0, 180));
      const changed = await fetch(`${env.apiUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: env.anonKey,
          authorization: `Bearer ${verifiedBody.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ password: "Phase05-Local-2" }),
      });
      assert.ok(changed.ok, await changed.text());
    }
  });
});
