
const db = window.supabaseClient;
const $ = id => document.getElementById(id);

let me = null;
let cats = [];
let prompts = [];

function toast(t) {
    const x = $("toast");
    x.textContent = t;
    x.classList.add("show");
    setTimeout(() => x.classList.remove("show"), 2600);
}

function loginMsg(t) {
    $("loginMessage").textContent = t;
}

// Start application
async function start() {
    if (!db) {
        loginMsg("Set Supabase Project URL and anon key in config.js.");
        return;
    }

    const { data, error } = await db.auth.getSession();

    if (error) {
        loginMsg("Session Error: " + error.message);
        return;
    }

    if (data.session) {
        me = data.session.user;
        await boot();
    }
}

// Login
$("loginForm").addEventListener("submit", async e => {
    e.preventDefault();

    loginMsg("Signing in…");

    const { data, error } = await db.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("password").value
    });

    if (error) {
        loginMsg("Login Error: " + error.message);
        return;
    }

    me = data.user;
    await boot();
});

// Check admin/editor access
async function boot() {
    const { data: p, error } = await db
        .from("profiles")
        .select("role")
        .eq("id", me.id)
        .single();

    if (error) {
        console.error("PROFILE ERROR:", error);
        loginMsg("Profile Error: " + error.message);
        return;
    }

    if (!p || !["admin", "editor"].includes(p.role)) {
        loginMsg("Wrong role: " + (p?.role || "No role found"));
        return;
    }

    $("loginView").hidden = true;
    $("appView").hidden = false;
    $("userEmail").textContent = me.email || "";

    await loadCats();
    await loadPrompts();
    await loadAdmins();
}

// Logout
$("logout").onclick = async () => {
    await db.auth.signOut();
    location.reload();
};

// Navigation
function view(v) {
    document.querySelectorAll(".view").forEach(x =>
        x.classList.remove("active")
    );

    document.querySelectorAll(".nav").forEach(x =>
        x.classList.toggle("active", x.dataset.view === v)
    );

    $(v + "View").classList.add("active");

    $("pageTitle").textContent = {
        prompts: "Prompts",
        categories: "Categories",
        admins: "Admins & Team"
    }[v];
}

document.querySelectorAll(".nav").forEach(b => {
    b.onclick = () => view(b.dataset.view);
});

// Slug generator
const slug = s =>
    s.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

// Load categories
async function loadCats() {
    const { data, error } = await db
        .from("categories")
        .select("id,name,slug,is_active")
        .order("name");

    if (error) {
        toast(error.message);
        return;
    }

    cats = data || [];

    $("category").replaceChildren();

    cats.filter(c => c.is_active).forEach(c => {
        let o = document.createElement("option");
        o.value = c.id;
        o.textContent = c.name;
        $("category").append(o);
    });

    $("categoryList").replaceChildren();

    cats.forEach(c => {
        let r = document.createElement("div");
        r.className = "categoryrow";

        let n = document.createElement("span");
        n.textContent = c.name + " / " + c.slug;

        let s = document.createElement("span");
        s.textContent = c.is_active ? "Active" : "Hidden";

        r.append(n, s);
        $("categoryList").append(r);
    });
}

// Load prompts
async function loadPrompts() {
    const { data, error } = await db
        .from("prompts")
        .select("id,title,status,created_at,category_id,image_url,categories(name)")
        .order("created_at", { ascending: false });

    if (error) {
        toast(error.message);
        return;
    }

    prompts = data || [];

    $("total").textContent = prompts.length;

    $("published").textContent =
        prompts.filter(p => p.status === "published").length;

    $("drafts").textContent =
        prompts.filter(p => p.status === "draft").length;

    const body = $("promptRows");
    body.replaceChildren();

    if (!prompts.length) {
        let tr = document.createElement("tr");
        let td = document.createElement("td");

        td.colSpan = 4;
        td.textContent = "No prompts yet. Add your first prompt.";

        tr.append(td);
        body.append(tr);
        return;
    }

    prompts.forEach(p => {
        let tr = document.createElement("tr");

        let a = document.createElement("td");
        a.textContent = p.title;

        let c = document.createElement("td");
        c.textContent = p.categories?.name || "—";

        let s = document.createElement("td");
        s.textContent = p.status;

        let act = document.createElement("td");

        let edit = document.createElement("button");
        edit.className = "small";
        edit.textContent = "Edit";
        edit.onclick = () => editPrompt(p.id);

        let del = document.createElement("button");
        del.className = "small danger";
        del.textContent = "Delete";
        del.onclick = () => deletePrompt(p.id);

        act.append(edit, del);
        tr.append(a, c, s, act);
        body.append(tr);
    });
}

// Load admins
async function loadAdmins() {
    const { data, error } = await db
        .from("profiles")
        .select("id,display_name,role")
        .in("role", ["admin", "editor"])
        .order("created_at");

    const box = $("adminList");
    box.replaceChildren();

    if (error) {
        box.textContent = error.message;
        return;
    }

    (data || []).forEach(p => {
        let r = document.createElement("div");
        r.className = "categoryrow";

        let n = document.createElement("b");
        n.textContent = p.display_name || "Staff member";

        let role = document.createElement("span");
        role.textContent = p.role;

        r.append(n, role);
        box.append(r);
    });
}

// Add prompt form
function openForm() {
    $("promptForm").reset();
    $("promptId").value = "";
    $("dialogTitle").textContent = "Add prompt";
    $("formMessage").textContent = "";
    $("dialog").hidden = false;
}

function closeForm() {
    $("dialog").hidden = true;
}

$("addPrompt").onclick = openForm;
$("closeDialog").onclick = closeForm;
$("cancel").onclick = closeForm;

// Edit prompt
async function editPrompt(id) {
    const { data, error } = await db
        .from("prompts")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        toast(error.message);
        return;
    }

    $("promptForm").reset();

    $("promptId").value = data.id;
    $("title").value = data.title;
    $("category").value = data.category_id || "";
    $("description").value = data.description || "";
    $("promptText").value = data.prompt_text;
    $("imageUrl").value = data.image_url || "";
    $("featured").checked = !!data.is_featured;
    $("pinned").checked = !!data.is_pinned;
    $("status").value = data.status;

    $("dialogTitle").textContent = "Edit prompt";
    $("dialog").hidden = false;
}

// Delete prompt
async function deletePrompt(id) {
    if (!confirm("Permanently delete this prompt?")) return;

    const { error } = await db
        .from("prompts")
        .delete()
        .eq("id", id);

    if (error) {
        toast(error.message);
        return;
    }

    toast("Prompt deleted");
    loadPrompts();
}

// Save prompt
$("promptForm").addEventListener("submit", async e => {
    e.preventDefault();

    $("save").disabled = true;
    $("formMessage").textContent = "Saving…";

    try {
        const id = $("promptId").value;
        const title = $("title").value.trim();

        let image_url = $("imageUrl").value.trim();
        let file = $("imageFile").files[0];

        if (file) {
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                throw Error("Image must be JPG, PNG or WebP.");
            }

            if (file.size > 5 * 1024 * 1024) {
                throw Error("Image must be under 5 MB.");
            }

            let ext = file.name.split(".").pop().toLowerCase();
            let path = me.id + "/" + crypto.randomUUID() + "." + ext;

            let up = await db.storage
                .from("prompt-images")
                .upload(path, file, { contentType: file.type });

            if (up.error) throw up.error;

            image_url = db.storage
                .from("prompt-images")
                .getPublicUrl(path).data.publicUrl;

        } else if (id && !image_url) {
            image_url = prompts.find(p => p.id === id)?.image_url || null;
        }

        const payload = {
            title,
            slug: slug(title),
            category_id: $("category").value || null,
            description: $("description").value.trim(),
            prompt_text: $("promptText").value.trim(),
            image_url: image_url || null,
            is_featured: $("featured").checked,
            is_pinned: $("pinned").checked,
            status: $("status").value,
            created_by: me.id
        };

        const result = id
            ? await db.from("prompts").update(payload).eq("id", id)
            : await db.from("prompts").insert(payload);

        if (result.error) throw result.error;

        closeForm();
        toast("Prompt saved");
        await loadPrompts();

    } catch (err) {
        $("formMessage").textContent =
            err.message || "Could not save prompt";

    } finally {
        $("save").disabled = false;
    }
});

// Add category
$("categoryForm").addEventListener("submit", async e => {
    e.preventDefault();

    const name = $("categoryName").value.trim();

    const { error } = await db
        .from("categories")
        .insert({
            name,
            slug: slug($("categorySlug").value),
            description: name + " AI prompts"
        });

    if (error) {
        toast(error.message);
        return;
    }

    $("categoryForm").reset();
    toast("Category added");
    loadCats();
});

// Run application
start();