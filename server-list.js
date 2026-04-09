/**
 * @file server-list.js
 * @description Advanced Server Cluster Manager powered by Axios & Lodash.
 */

const ServerMatrix =[
    { id: "omega_hls", name: "Omega Direct (HLS)", type: "native", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", weight: 100, latency: 0 },
    { id: "vidlink_pro", name: "VidLink Ultra", type: "sandbox", url: "https://vidlink.pro", weight: 90, latency: 0 },
    { id: "vidsrc_pro", name: "VidSrc Premium", type: "sandbox", url: "https://vidsrc.pro/embed", weight: 80, latency: 0 },
    { id: "autoembed_cc", name: "AutoEmbed V2", type: "sandbox", url: "https://player.autoembed.cc/embed", weight: 70, latency: 0 }
];

class ClusterManager {
    constructor() {
        this.servers = ServerMatrix;
        this.activeServer = this.servers[0];
    }

    async analyzeLatency() {
        console.log("[CLUSTER] Initiating Ping Matrix...");
        const promises = this.servers.map(async (srv) => {
            const start = performance.now();
            try {
                // Ping using Axios
                await axios.get(srv.url, { timeout: 3000 });
                srv.latency = performance.now() - start;
            } catch (e) {
                srv.latency = e.code === 'ECONNABORTED' ? 3000 : performance.now() - start; // Estimate
            }
            return srv;
        });

        await Promise.all(promises);
        this.servers = _.sortBy(this.servers, 'latency'); // Using Lodash
        this.activeServer = this.servers[0];
        console.log(`[CLUSTER] Node Locked: ${this.activeServer.name} (${this.activeServer.latency.toFixed(1)}ms)`);
        return this.activeServer;
    }

    buildRoute(type, tmdbId, season = 1, episode = 1) {
        const srv = this.activeServer;
        // If native, we return a direct .m3u8 stream manifest
        if (srv.type === "native") return srv.url; 
        
        // Sandbox routing
        switch(srv.id) {
            case "vidlink_pro": return type === "movie" ? `${srv.url}/movie/${tmdbId}?primaryColor=e50914&autoplay=true` : `${srv.url}/tv/${tmdbId}/${season}/${episode}?primaryColor=e50914`;
            default: return type === "movie" ? `${srv.url}/movie/${tmdbId}` : `${srv.url}/tv/${tmdbId}/${season}/${episode}`;
        }
    }
}
window.ServerCluster = new ClusterManager();
