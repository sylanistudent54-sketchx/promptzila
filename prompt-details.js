
// ========================================
// PROMPT DETAILS JAVASCRIPT
// ========================================

const params = new URLSearchParams(window.location.search);
const promptId = params.get("id");

const loading = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const details = document.getElementById("promptDetails");

let currentPrompt = null;


// ========================================
// LOAD SELECTED PROMPT
// ========================================

async function loadPromptDetails() {

    if (!promptId) {
        showError();
        return;
    }

    // Try Supabase first
    const c = window.supabaseClient;

    if (c) {
        try {
            const { data, error } = await c
                .from("prompts")
                .select("id,title,description,prompt_text,image_url,categories(name)")
                .eq("id", promptId)
                .eq("status", "published")
                .single();

            if (!error && data) {
                currentPrompt = {
                    ...data,
                    category_name: data.categories?.name || "Other"
                };

                displayPrompt();
                return;
            }

        } catch (e) {
            console.warn("Supabase prompt lookup failed:", e.message);
        }
    }

    // Demo / session fallback
    try {
        const saved = sessionStorage.getItem("selectedPrompt");

        if (saved) {
            const p = JSON.parse(saved);

            if (String(p.id) === String(promptId)) {
                currentPrompt = p;
                displayPrompt();
                return;
            }
        }

    } catch (e) {
        console.warn("Saved prompt could not be read:", e);
    }

    showError();
}


// ========================================
// DISPLAY PROMPT
// ========================================

function displayPrompt() {

    loading.hidden = true;
    errorMessage.hidden = true;
    details.hidden = false;

    document.title = currentPrompt.title + " — Promptzila";

    const img = document.getElementById("detailImage");

    img.src = currentPrompt.image_url || "";
    img.alt = currentPrompt.title || "Prompt image";

    document.getElementById("detailTitle").textContent =
        currentPrompt.title || "AI Photo Prompt";

    document.getElementById("detailPrompt").textContent =
        currentPrompt.prompt_text || "Prompt text is not available.";

}


// ========================================
// ERROR MESSAGE
// ========================================

function showError() {
    loading.hidden = true;
    details.hidden = true;
    errorMessage.hidden = false;
}


// ========================================
// COPY PROMPT
// ========================================

document.getElementById("copyPrompt").addEventListener("click", async () => {

    if (!currentPrompt || !currentPrompt.prompt_text) return;

    const button = document.getElementById("copyPrompt");

    try {
        await navigator.clipboard.writeText(currentPrompt.prompt_text);

        button.textContent = "✓ Copied!";

        setTimeout(() => {
            button.textContent = "Copy Prompt";
        }, 2000);

    } catch (e) {
        button.textContent = "Copy failed — use HTTPS or localhost";
    }

});


// ========================================
// MOBILE MENU
// ========================================

const menu = document.getElementById("mobileMenu");
const nav = document.getElementById("navLinks");

menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");

    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "×" : "☰";
});


// ========================================
// START
// ========================================

loadPromptDetails();