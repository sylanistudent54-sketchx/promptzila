
// ========================================
// PROMPTZILA - MAIN JAVASCRIPT
// ========================================

const demo = [
    {id:"d1",title:"Cinematic Traditional Portrait",category_name:"Girls",badge:"Pinned",image_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700",description:"A warm cinematic portrait.",prompt_text:"Create a realistic cinematic portrait in an elegant traditional outfit, warm golden lighting, natural skin texture, DSLR photography and beautiful background blur."},
    {id:"d2",title:"Luxury Male Portrait",category_name:"Boys",badge:"Trending",image_url:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700",description:"A luxury editorial portrait.",prompt_text:"Create a cinematic portrait of a stylish young man, dramatic studio lighting, realistic details, luxury atmosphere and high-end fashion photography."},
    {id:"d3",title:"Romantic Couple",category_name:"Couple",badge:"Pinned",image_url:"https://images.unsplash.com/photo-1519741497674-611481863552?w=700",description:"Romantic couple photography.",prompt_text:"Create a beautiful romantic couple portrait with natural expressions, elegant outfits, soft background blur and realistic professional photography."},
    {id:"d4",title:"Aesthetic Portrait",category_name:"Girls",badge:"New",image_url:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700",description:"Soft natural-light portrait.",prompt_text:"Create an aesthetic portrait with natural makeup, soft sunlight, realistic skin texture, elegant styling and professional portrait photography."},
    {id:"d5",title:"Street Fashion",category_name:"Boys",badge:"Pinned",image_url:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700",description:"Urban street fashion.",prompt_text:"Create a cinematic street fashion portrait using urban architecture, dramatic shadows, natural lighting and professional fashion photography."},
    {id:"d6",title:"Cinematic Sunset",category_name:"Cinematic",badge:"Trending",image_url:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700",description:"Golden-hour cinematic scenery.",prompt_text:"Create a cinematic sunset scene with golden-hour lighting, atmospheric depth, realistic colors and professional landscape photography."},
    {id:"d7",title:"Elegant Couple Portrait",category_name:"Couple",badge:"New",image_url:"https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=700",description:"Warm romantic atmosphere.",prompt_text:"Create an elegant couple portrait with authentic expressions, coordinated outfits, soft warm light and realistic editorial photography."},
    {id:"d8",title:"Golden Hour",category_name:"Cinematic",badge:"Pinned",image_url:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700",description:"Cinematic golden-hour scene.",prompt_text:"Create a cinematic golden-hour photograph with warm sunlight, balanced composition, natural colors and realistic details."}
];

let prompts = demo;
let activeCategory = "All";
let showingFavorites = false;
let showingRecentlyViewed = false;

// ========================================
// ELEMENTS
// ========================================

const gallery = document.getElementById("promptGallery");
const search = document.getElementById("searchInput");
const empty = document.getElementById("emptyMessage");
const favoritesLink = document.getElementById("favoritesNavLink");
const recentLink = document.getElementById("recentNavLink");
const galleryTitle = document.getElementById("galleryTitle");
const gallerySubtitle = document.getElementById("gallerySubtitle");

// ========================================
// FAVORITES - LOCAL STORAGE
// ========================================

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem("promptzilaFavorites")) || [];
    } catch (error) {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem("promptzilaFavorites", JSON.stringify(favorites));
}

function isFavorite(id) {
    return getFavorites().includes(String(id));
}

function toggleFavorite(id) {
    let favorites = getFavorites();
    id = String(id);

    if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
    } else {
        favorites.push(id);
    }

    saveFavorites(favorites);
    render();
}

// ========================================
// RECENTLY VIEWED - LOCAL STORAGE
// ========================================

function getRecentlyViewed() {
    try {
        const saved = JSON.parse(localStorage.getItem("promptzilaRecentlyViewed"));
        return Array.isArray(saved) ? saved.map(String) : [];
    } catch (error) {
        return [];
    }
}

function saveRecentlyViewed(id) {
    try {
        const recent = getRecentlyViewed().filter(item => item !== String(id));
        recent.unshift(String(id));
        localStorage.setItem("promptzilaRecentlyViewed", JSON.stringify(recent.slice(0, 10)));
    } catch (error) {
        console.warn("Recently viewed list could not be saved:", error);
    }
}


// ========================================
// LOAD PROMPTS FROM SUPABASE
// ========================================

async function loadLive() {
    const c = window.supabaseClient;
    if (!c) return;

    try {
        const { data, error } = await c
            .from("prompts")
            .select("id,title,description,prompt_text,image_url,is_featured,is_pinned,categories(name)")
            .eq("status", "published")
            .order("created_at", { ascending: false });

        if (error) throw error;

        prompts = (data || []).map(p => ({
            ...p,
            category_name: p.categories?.name || "Other",
            badge: p.is_featured ? "Featured" : p.is_pinned ? "Pinned" : "Prompt"
        }));

        render();

    } catch (e) {
        console.warn("Using demo prompts:", e.message);
    }
}

// ========================================
// DISPLAY PROMPT CARDS
// ========================================

function render() {
    const term = search.value.trim().toLowerCase();
    const favorites = getFavorites();
    const recentIds = getRecentlyViewed();

    let list = prompts.filter(p =>
        (activeCategory === "All" || p.category_name === activeCategory) &&
        [p.title, p.category_name, p.description, p.prompt_text]
            .join(" ")
            .toLowerCase()
            .includes(term)
    );

    if (showingFavorites) {
        list = list.filter(p => favorites.includes(String(p.id)));
    } else if (showingRecentlyViewed) {
        list = recentIds
            .map(id => prompts.find(p => String(p.id) === id))
            .filter(Boolean)
            .filter(p =>
                (activeCategory === "All" || p.category_name === activeCategory) &&
                [p.title, p.category_name, p.description, p.prompt_text]
                    .join(" ")
                    .toLowerCase()
                    .includes(term)
            );
    }

    if (galleryTitle && gallerySubtitle) {
        if (showingFavorites) {
            galleryTitle.textContent = "Your Favorites";
            gallerySubtitle.textContent = "All the prompts you have saved.";
        } else if (showingRecentlyViewed) {
            galleryTitle.textContent = "Recently Viewed";
            gallerySubtitle.textContent = "Your 10 most recently opened prompts.";
        } else {
            galleryTitle.textContent = "Explore Prompts";
            gallerySubtitle.textContent = "Find the perfect prompt for your next creation.";
        }
    }

    gallery.replaceChildren();

    empty.hidden = list.length > 0;
    empty.textContent = showingFavorites
        ? "You haven't added any favorites yet. ❤️"
        : showingRecentlyViewed
            ? "You haven't viewed any prompts yet. Open a prompt and it will appear here. 🕘"
            : "No prompts found. Try another search.";

    list.forEach(p => {
        const card = document.createElement("article");
        card.className = "prompt-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.textContent = "✦ " + (p.badge || "Prompt");

        const img = document.createElement("img");
        img.src = p.image_url || "https://placehold.co/600x800/211d2e/fff?text=Promptzila";
        img.alt = p.title;
        img.loading = "lazy";

        const over = document.createElement("div");
        over.className = "card-overlay";

        const h = document.createElement("h3");
        h.textContent = p.title;

        const cat = document.createElement("p");
        cat.textContent = (p.category_name || "Other") + " · View Prompt →";

        over.append(h, cat);

        const favoriteBtn = document.createElement("button");
        favoriteBtn.className = "favorite-btn";
        favoriteBtn.type = "button";

        const saved = isFavorite(p.id);
        favoriteBtn.textContent = saved ? "♥" : "♡";
        favoriteBtn.classList.toggle("is-favorite", saved);
        favoriteBtn.setAttribute("aria-label", saved ? "Remove from favorites" : "Add to favorites");
        favoriteBtn.setAttribute("aria-pressed", String(saved));

        favoriteBtn.addEventListener("click", event => {
            event.stopPropagation();
            toggleFavorite(p.id);
        });

        card.append(badge, img, over, favoriteBtn);
        card.addEventListener("click", () => openPromptPage(p));

        card.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPromptPage(p);
            }
        });

        gallery.append(card);
    });
}

// ========================================
// OPEN PROMPT DETAILS PAGE
// ========================================

function openPromptPage(p) {
    saveRecentlyViewed(p.id);

    try {
        sessionStorage.setItem("selectedPrompt", JSON.stringify(p));
    } catch (e) {
        console.warn("Could not save prompt for fallback:", e);
    }

    window.location.href =
        "prompt-details.html?id=" + encodeURIComponent(p.id);
}

// ========================================
// CATEGORY FILTERS
// ========================================

document.querySelectorAll(".filter-btn").forEach(b => {
    b.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(x =>
            x.classList.remove("active")
        );

        b.classList.add("active");
        activeCategory = b.dataset.category;
        showingFavorites = false;
        showingRecentlyViewed = false;

        render();
    });
});

// ========================================
// FAVORITES & RECENTLY VIEWED NAVIGATION
// ========================================

function closeMobileMenu() {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";
}

function resetCategoryFilter() {
    activeCategory = "All";
    document.querySelectorAll(".filter-btn").forEach(x => x.classList.remove("active"));
    document.querySelector('.filter-btn[data-category="All"]')?.classList.add("active");
}

function showAllPrompts() {
    showingFavorites = false;
    showingRecentlyViewed = false;
    resetCategoryFilter();
    search.value = "";
    render();
    closeMobileMenu();
}

function showFavorites() {
    showingFavorites = true;
    showingRecentlyViewed = false;
    resetCategoryFilter();
    search.value = "";
    render();
    document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
    closeMobileMenu();
}

function showRecentlyViewed() {
    showingFavorites = false;
    showingRecentlyViewed = true;
    resetCategoryFilter();
    search.value = "";
    render();
    document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
    closeMobileMenu();
}

favoritesLink?.addEventListener("click", showFavorites);
recentLink?.addEventListener("click", showRecentlyViewed);

document.getElementById("homeNavLink")?.addEventListener("click", showAllPrompts);
document.getElementById("exploreNavLink")?.addEventListener("click", showAllPrompts);

// ========================================
// SEARCH
// ========================================

search.addEventListener("input", render);

// ========================================
// MOBILE NAVIGATION
// ========================================

const menu = document.getElementById("mobileMenu");
const nav = document.getElementById("navLinks");

menu.addEventListener("click", () => {
    const v = nav.classList.toggle("open");

    menu.setAttribute("aria-expanded", String(v));
    menu.textContent = v ? "×" : "☰";
});

// ========================================
// INITIALIZE
// ========================================

render();
loadLive();

