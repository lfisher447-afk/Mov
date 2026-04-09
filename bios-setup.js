const BIOS_CONFIG = {
    "System":[
        { id: "fast_boot", label: "Fast Boot Protocol", type: "toggle", help: "Bypass identity checks on kernel load." },
        { id: "haptics", label: "Haptic Feedback Multiplier", type: "slider", min: 0, max: 100, help: "Device vibration intensity for physical devices." },
        { id: "theme", label: "UI Theme Enforcer", type: "select", opts:["ironclad", "teneflix", "godmode"], help: "Select base CSS matrix variables." }
    ],
    "Security":[
        { id: "export_sys", label: ">>> SECURE EXPORT (.BBOX)", type: "action", action: "exportEncrypted()", help: "AES-256 encrypts your system state to a local file." },
        { id: "import_sys", label: ">>> SECURE IMPORT (.BBOX)", type: "action", action: "importEncrypted()", help: "Decrypts and restores a .bbox file." },
        { id: "nuke_db", label: ">>> FORMAT SYSTEM DRIVES", type: "action", action: "nukeSystem()", help: "Wipes all IndexedDB and LocalStorage." }
    ]
};

let activeTab = "System";
let sysState = JSON.parse(localStorage.getItem('bb_settings')) || { fast_boot: false, haptics: 50, theme: "ironclad" };

function render() {
    document.getElementById('bios-tabs').innerHTML = Object.keys(BIOS_CONFIG).map(t => `<div class="bios-tab ${t === activeTab ? 'active' : ''}" onclick="activeTab='${t}';render()">${t}</div>`).join('');
    
    document.getElementById('bios-content').innerHTML = BIOS_CONFIG[activeTab].map(item => {
        let valStr = "";
        if(item.type === 'toggle') valStr = `[${sysState[item.id] ? 'Enabled ' : 'Disabled'}]`;
        if(item.type === 'slider') valStr = `[ ${sysState[item.id]} ]`;
        if(item.type === 'select') valStr = `< ${sysState[item.id].toUpperCase()} >`;
        if(item.type === 'action') valStr = "[PRESS ENTER]";
        return `<div class="bios-row" onmouseover="document.getElementById('help-text').innerText='${item.help}'" onclick="handleItem('${item.id}')"><span>${item.label}</span><span class="bios-val">${valStr}</span></div>`;
    }).join('');
}

function handleItem(id) {
    const item = BIOS_CONFIG[activeTab].find(i => i.id === id);
    if(item.type === 'action') return eval(item.action);
    if(item.type === 'toggle') sysState[id] = !sysState[id];
    if(item.type === 'select') { const idx = item.opts.indexOf(sysState[id]); sysState[id] = item.opts[(idx + 1) % item.opts.length]; }
    if(item.type === 'slider') { const v = prompt(`Enter value (${item.min}-${item.max}):`); if(v && !isNaN(v)) sysState[id] = Math.max(item.min, Math.min(item.max, parseInt(v))); }
    localStorage.setItem('bb_settings', JSON.stringify(sysState));
    render();
}

function exportEncrypted() {
    const pass = prompt("Enter AES Encryption Key:");
    if(!pass) return;
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(sysState), pass).toString();
    const blob = new Blob([ciphertext], {type: "application/octet-stream"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `system_${Date.now()}.bbox`;
    a.click();
}

function nukeSystem() { 
    if(confirm("Are you sure? System will be wiped.")) { 
        localStorage.clear(); 
        alert("System Format Complete."); 
        location.href='index.html'; 
    } 
}

setInterval(() => document.getElementById('sys-time').innerText = new Date().toLocaleTimeString(), 1000);
document.addEventListener('keydown', e => { if(e.key === 'F10' || e.key === 'Escape') location.href = 'index.html'; });
render();
