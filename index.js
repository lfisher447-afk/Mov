/**
 * TENEFLIX OMEGA - IRONCLAD V-15 CORE ENGINE
 * Powered by 21 Advanced jsDelivr Libraries.
 */

const CONFIG = {
    TMDB_KEY: "15d2ea6d0dc1d476efbca3eba2b9bbfb",
    API: "https://api.themoviedb.org/3",
    IMG: "https://image.tmdb.org/t/p"
};

// ==========================================
// 1. AUDIO SUBSYSTEM (Howler.js)
// ==========================================
const SFX = {
    hover: new Howl({ src:['data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'], volume: 0.1 }), // Mock base64 for silent click
    success: new Howl({ src:['data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'], volume: 0.3 })
};

// ==========================================
// 2. 3D BACKGROUND SUBSYSTEM (Three.js)
// ==========================================
const WebGLBg = {
    init() {
        const canvas = document.getElementById('three-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvas.appendChild(renderer.domElement);

        // Cyber Grid
        const grid = new THREE.GridHelper(200, 50, 0xe11d48, 0x222222);
        grid.position.y = -10;
        scene.add(grid);

        camera.position.z = 30;
        camera.position.y = 5;

        function animate() {
            requestAnimationFrame(animate);
            grid.rotation.y += 0.001;
            renderer.render(scene, camera);
        }
        animate();
    }
};

// ==========================================
// 3. STORAGE ENGINE (LocalForage + Lodash)
// ==========================================
const DB = {
    init() {
        localforage.config({ name: 'TeneflixOmega', storeName: 'neural_cache' });
    },
    async fetchAPI(endpoint, params = {}) {
        const url = `${CONFIG.API}${endpoint}?api_key=${CONFIG.TMDB_KEY}&${new URLSearchParams(params)}`;
        
        // Check LocalForage Cache
        const cached = await localforage.getItem(url);
        if (cached && dayjs().diff(dayjs(cached.time), 'hour') < 1) {
            return cached.data;
        }

        // Network Fetch via Axios
        try {
            const res = await axios.get(url);
            await localforage.setItem(url, { data: res.data, time: Date.now() });
            return res.data;
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'API Cluster Offline', text: e.message, background: '#0a0a0a' });
            return null;
        }
    }
};

// ==========================================
// 4. OMEGA CUSTOM PLAYER (Plyr + HLS.js + Object Wrapper)
// ==========================================
const OmegaPlayer = {
    plyrInstance: null,
    
    init() {
        const videoElement = document.getElementById('plyr-video');
        this.plyrInstance = new Plyr(videoElement, {
            controls:['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
            settings:['captions', 'quality', 'speed'],
            theme: '#e11d48'
        });
    },

    async open(type, id) {
        SFX.success.play();
        const srv = await window.ServerCluster.analyzeLatency();
        const route = window.ServerCluster.buildRoute(type, id);
        
        document.getElementById('player-server-badge').innerText = `NODE: ${srv.name.toUpperCase()}`;
        
        const portal = document.getElementById('omega-player-portal');
        const nativeWrap = document.getElementById('native-player-wrapper');
        const sandboxWrap = document.getElementById('sandbox-player-wrapper');
        const sandboxObj = document.getElementById('sandbox-object');

        // Reveal Portal with Anime.js
        portal.style.display = 'flex';
        anime({ targets: portal, opacity: [0, 1], duration: 800, easing: 'easeInOutQuad' });

        if (srv.type === "native" && Hls.isSupported()) {
            // MODE A: Pure HTML5 HLS Streaming
            sandboxWrap.classList.add('hidden');
            nativeWrap.classList.remove('hidden');
            
            const hls = new Hls();
            hls.loadSource(route); // Expecting .m3u8
            hls.attachMedia(document.getElementById('plyr-video'));
            hls.on(Hls.Events.MANIFEST_PARSED, () => this.plyrInstance.play());
        } else {
            // MODE B: Advanced Object Sandbox (Iframe bypass)
            nativeWrap.classList.add('hidden');
            sandboxWrap.classList.remove('hidden');
            
            // Using <object> prevents certain X-Frame limitations and hides it from simple adblock iframe scrubbers
            sandboxObj.setAttribute('data', route);
        }
    },

    close() {
        const portal = document.getElementById('omega-player-portal');
        anime({
            targets: portal, opacity: 0, duration: 500, easing: 'easeInOutQuad',
            complete: () => {
                portal.style.display = 'none';
                if(this.plyrInstance) this.plyrInstance.stop();
                document.getElementById('sandbox-object').removeAttribute('data');
            }
        });
    }
};

// ==========================================
// 5. COMMAND PALETTE & UI COMPONENTS
// ==========================================
const CmdPalette = {
    init() {
        const p = document.getElementById('cmd-palette');
        const inp = document.getElementById('cmd-input');
        
        window.addEventListener('keydown', e => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { 
                e.preventDefault(); 
                p.style.display = 'flex';
                anime({ targets: p, opacity: [0, 1], duration: 300 });
                inp.focus(); 
            }
            if (e.key === 'Escape') this.close();
        });

        // Lodash debounce for API hammering protection
        inp.addEventListener('input', _.debounce(async (e) => {
            const val = e.target.value;
            if (val.startsWith('/')) this.executeSys(val);
            else this.searchTMDB(val);
        }, 500));
    },
    close() {
        const p = document.getElementById('cmd-palette');
        anime({ targets: p, opacity: 0, duration: 300, complete: () => p.style.display = 'none' });
    },
    async searchTMDB(query) {
        if(!query) return;
        const res = await DB.fetchAPI('/search/multi', { query });
        const html = res.results.filter(i=>i.poster_path).slice(0, 6).map(i => `
            <div class="cmd-item" onclick="OmegaPlayer.open('${i.media_type||'movie'}', ${i.id}); CmdPalette.close()">
                <img src="${CONFIG.IMG}/w92${i.poster_path}" class="w-12 h-16 rounded object-cover shadow-lg">
                <div>
                    <h4 class="font-bold text-white">${i.title || i.name}</h4>
                    <p class="text-xs font-mono text-rose-600 mt-1">${i.media_type.toUpperCase()} | TMDB_${i.id}</p>
                </div>
            </div>
        `).join('');
        document.getElementById('cmd-results').innerHTML = html;
    },
    executeSys(cmd) {
        if(cmd === '/bios') location.href = 'bios-setup.html';
        if(cmd === '/purge') { localforage.clear(); Swal.fire('Cache Purged', 'LocalForage DB cleared.', 'success'); }
    }
};

// ==========================================
// 6. CORE ENGINE (State & Rendering)
// ==========================================
const Engine = {
    async init() {
        AOS.init(); // Init Scroll animations
        DB.init();
        WebGLBg.init();
        OmegaPlayer.init();
        CmdPalette.init();
        
        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if(window.scrollY > 50) nav.classList.add('solid');
            else nav.classList.remove('solid');
        });

        await this.loadHome();
    },

    async loadHome() {
        const [trending, popMovies, popTv] = await Promise.all([
            DB.fetchAPI('/trending/all/day'),
            DB.fetchAPI('/movie/popular'),
            DB.fetchAPI('/tv/popular')
        ]);

        // Build Hero
        const hero = trending.results[0];
        document.getElementById('hero').style.backgroundImage = `url(${CONFIG.IMG}/original${hero.backdrop_path})`;
        document.getElementById('hero-title').innerText = hero.title || hero.name;
        document.getElementById('hero-desc').innerText = hero.overview;
        
        document.getElementById('hero-play').onclick = () => OmegaPlayer.open(hero.media_type || 'movie', hero.id);

        // Build Virtual DOM Rows
        let html = this.buildRow("Trending Node Cluster", trending.results.slice(1, 15));
        html += this.buildRow("High-Bandwidth Executables", popMovies.results.slice(0, 14));
        html += this.buildRow("Serialized Neural Feeds", popTv.results.slice(0, 14));
        
        document.getElementById('matrix-feed').innerHTML = html;
        lucide.createIcons();
        
        // Initialize Tippy.js tooltips on all cards
        tippy('.card-3d', { placement: 'top', animation: 'scale', theme: 'translucent' });
    },

    buildRow(title, items) {
        const cards = items.map(item => `
            <div class="w-[200px] flex-none card-3d cursor-pointer" data-tippy-content="Rating: ${item.vote_average?.toFixed(1)} | Year: ${(item.release_date || '2026').split('-')[0]}" onclick="OmegaPlayer.open('${item.media_type||'movie'}', ${item.id})" onmouseenter="SFX.hover.play()">
                <div class="aspect-[2/3] glass-panel card-3d-inner rounded-2xl overflow-hidden relative group border border-white/10">
                    <img src="${CONFIG.IMG}/w500${item.poster_path}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i data-lucide="play-circle" class="w-12 h-12 text-rose-600 drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]"></i>
                    </div>
                </div>
                <div class="mt-4 px-2">
                    <h4 class="font-bold text-sm truncate text-white/90 uppercase tracking-wide">${item.title || item.name}</h4>
                </div>
            </div>
        `).join('');

        return `
            <div class="content-row" data-aos="fade-up">
                <div class="row-header">
                    <h2 class="row-title text-white">${title}</h2>
                    <span class="text-rose-600 text-xs font-mono cursor-pointer hover:text-white transition-colors">EXPAND_ALL >></span>
                </div>
                <div class="row-track custom-scroll pb-6 pt-4 px-2">${cards}</div>
            </div>
        `;
    }
};

// BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => Engine.init());
