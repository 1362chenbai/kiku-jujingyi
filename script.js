/**
 * script.js - 功能逻辑实现
 * 移除了懒加载以确保所有图片 100% 可见。
 */

// 全局配置对象
const CONFIG = {
    PASSWORD: '0618',                                 // 网站访问密码
    IMAGE_BASE_URL: 'https://c.chenbq.xyz/ju',        // 图片基础 URL
    // IMAGE_NAME_FORMAT 支持占位符 {index}，示例：
    //  - ' ({index}).png' -> 原始风格，生成: base + ' (1).png'
    //  - '/images/{index}.png' -> 带路径风格，生成: base + '/images/1.png'
    //  - '{index}.png' -> 紧邻 base 的命名: base + '1.png'
    IMAGE_NAME_FORMAT: ' ({index}).png',
    VIDEO_URL_TEMPLATE: 'https://c.chenbq.xyz/jss%20(${index}).mp4', // 视频 URL 模板
    // VIDEO_NAME_FORMAT 支持占位符 {index}，示例： 'jss ({index}).mp4'
    VIDEO_NAME_FORMAT: 'jss ({index}).mp4',
    TOTAL_IMAGES: 1354,                               // 图片总数
    immediateLoadCount: 12,                            // 每页立即加载的缩略图数量（首屏优化）
    TOTAL_VIDEOS: 20,                                 // 视频总数
    CAROUSEL_DELAY: 5000,                             // 轮播图自动切换间隔 (5秒)
    HITOKOTO_API: 'https://v1.hitokoto.cn',           // 一言 API 接口
    WEATHER_API: 'https://wttr.in/Guangzhou?format=j1&lang=zh-CN' // 天气 API 接口 (广州)
};

// 安全的资源 URL 生成器，避免空格与特殊字符直接拼接导致的请求失败
function getImageUrl(index) {
    // index is 1-based when forming filename
    const base = CONFIG.IMAGE_BASE_URL.replace(/\/+$/,'');
    const fmt = CONFIG.IMAGE_NAME_FORMAT || '{index}.png';
    // 用 {index} 占位符生成文件名
    const rawName = fmt.replace('{index}', String(index));
    // 如果格式以 / 开头，直接附加到 base；否则直接拼接（保留原始格式中的空格或括号，使用 encodeURI 对特殊字符编码）
    // encodeURI 保留斜杠，适合对路径进行编码
    const encoded = encodeURI(rawName);
    return `${base}${encoded}`;
}

function getVideoUrl(index) {
    // 返回视频 URL，index 为 1-based
    // 如果原模板使用占位符则替换，否则按简单模式拼接
    if (CONFIG.VIDEO_URL_TEMPLATE && CONFIG.VIDEO_URL_TEMPLATE.includes('${index}')) {
        return CONFIG.VIDEO_URL_TEMPLATE.replace('${index}', encodeURIComponent(String(index)));
    }
    const base = CONFIG.IMAGE_BASE_URL.replace(/\/+$/,'');
    const fmt = CONFIG.VIDEO_NAME_FORMAT || 'video-{index}.mp4';
    const rawName = fmt.replace('{index}', String(index));
    return `${base}/${encodeURI(rawName)}`;
}

// 全局状态管理器
const State = {
    carouselIndex: 0,       // 当前轮播图索引
    videoIndex: 0,          // 当前视频索引
    isMusicPlaying: false,   // 音乐播放状态
    autoPlayTimer: null     // 轮播自动播放定时器
};

// 通用工具类
const Utils = {
    // 等待函数
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    // 快速创建 DOM 元素的助手函数
    createEl(tag, props = {}, children = []) {
        const el = document.createElement(tag);
        // 更健壮地处理 props：
        // - 对于带连字符的属性（如 data-index / aria-* / custom-attr）使用 setAttribute
        // - 对于 className, textContent, innerHTML 等常见属性直接赋值
        for (const [k, v] of Object.entries(props)) {
            if (k === 'className') el.className = v;
            else if (k === 'textContent') el.textContent = v;
            else if (k === 'innerHTML') el.innerHTML = v;
            else if (k.startsWith('data-') || k.includes('-')) el.setAttribute(k, v);
            else el[k] = v;
        }
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child) el.appendChild(child);
        });
        return el;
    }
};

// 懒加载模块：为画廊图片添加 IntersectionObserver 懒加载
const LazyLoadModule = {
    observer: null,
    init() {
        if (!('IntersectionObserver' in window)) return; // 老浏览器跳过
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    this.observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px 0px' });
    },
    observe(img) { if (this.observer && img) this.observer.observe(img); }
};

// 安全模块：处理密码保护
const SecurityModule = {
    init() {
        const protection = document.getElementById('password-protection');
        const input = document.getElementById('password-input');
        const btn = document.getElementById('submit-password-btn');
        const error = document.getElementById('password-error');
        if (!protection) return;
        
        document.body.style.overflow = 'hidden'; // 锁定页面滚动

        const verify = () => {
            if (input.value === CONFIG.PASSWORD) {
                // 验证通过：淡出并移除保护层
                protection.style.opacity = '0';
                setTimeout(() => {
                    protection.style.display = 'none';
                    document.body.style.overflow = ''; // 恢复滚动
                }, 500);
            } else {
                // 验证失败：显示错误并清空输入
                error.style.display = 'block';
                input.value = '';
                input.focus();
            }
        };
        btn.onclick = verify;
        input.onkeypress = (e) => { if (e.key === 'Enter') verify(); };
    }
};

// 背景效果模块：粒子和数据流
const BackgroundModule = {
    init() {
        this.createParticles();
        this.createDataFlow();
    },
    // 创建随机漂浮的粒子
    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 60; i++) {
            const p = Utils.createEl('div', { className: 'particle' });
            const size = Math.random() * 18 + 5; // 随机大小 5px - 23px
            p.style.width = p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            // 随机设置动画时长和延迟
            p.style.animation = `float ${Math.random() * 45 + 25}s ease-in-out infinite ${Math.random() * 15}s`;
            fragment.appendChild(p);
        }
        container.appendChild(fragment);
    },
    // 创建动态的数据流线条
    createDataFlow() {
        const container = document.getElementById('data-flow');
        if (!container) return;
        let styleEl = document.getElementById('dynamic-flow-styles');
        if (!styleEl) {
            styleEl = Utils.createEl('style', { id: 'dynamic-flow-styles' });
            document.head.appendChild(styleEl);
        }
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 20; i++) {
            const line = Utils.createEl('div', { className: 'data-line' });
            const length = Math.random() * 200 + 70;
            const angle = Math.random() * 360;
            const randomId = Math.random().toString(36).substring(2, 11);
            line.style.width = `${length}px`;
            line.style.left = `${Math.random() * 100}%`;
            line.style.top = `${Math.random() * 100}%`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.animation = `flow_${randomId} ${Math.random() * 18 + 7}s linear infinite ${Math.random() * 12}s`;
            
            // 动态向 style 标签插入关键帧动画
            const keyframes = `@keyframes flow_${randomId} { 0% {transform: rotate(${angle}deg) translateX(-100%); opacity: 0;} 20% {opacity: 1;} 80% {opacity: 1;} 100% {transform: rotate(${angle}deg) translateX(100%); opacity: 0;} }`;
            styleEl.sheet.insertRule(keyframes, styleEl.sheet.cssRules.length);
            fragment.appendChild(line);
        }
        container.appendChild(fragment);
    }
};

// 信息模块：时间、名言、天气
const InfoModule = {
    async init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000); // 每秒更新时钟
        await Promise.all([this.fetchHitokoto(), this.fetchWeather()]);
    },
    // 更新当前日期时间
    updateClock() {
        const el = document.getElementById('datetime');
        if (!el) return;
        el.textContent = new Date().toLocaleString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Asia/Shanghai'
        });
    },
    // 获取一言 API 随机名言
    async fetchHitokoto() {
        try {
            const res = await fetch(CONFIG.HITOKOTO_API);
            const data = await res.json();
            document.getElementById('hitokoto-text').textContent = data.hitokoto;
            document.getElementById('hitokoto-from').textContent = `— ${data.from || data.source || '佚名'}`;
        } catch (e) { console.error(e); }
    },
    // 获取 wttr.in 天气信息
    async fetchWeather() {
        try {
            const res = await fetch(CONFIG.WEATHER_API);
            const data = await res.json();
            const current = data.current_condition[0];
            const location = data.nearest_area[0].areaName[0].value;
            document.getElementById('weather').textContent = 
                `${location}: ${current.weatherDesc[0].value}, ${current.temp_C}°C, ${current.winddir16Point} ${current.windspeedKmph}km/h`;
        } catch (e) { console.error(e); }
    }
};

// 轮播图模块
const CarouselModule = {
    init() {
        const container = document.getElementById('carousel-container');
        const indicators = document.getElementById('carousel-indicators');
        if (!container || !indicators) return;

        // 清空并保留指示点（指示点仍然为全部数量以便直接跳转）
        container.innerHTML = '';
        indicators.innerHTML = '';

        // 生成指示点（但不为每张图片创建 slide DOM）
        for (let i = 0; i < CONFIG.TOTAL_IMAGES; i++) {
            const dot = Utils.createEl('div', { className: `indicator ${i === 0 ? 'active' : ''}`, 'data-index': i });
            dot.onclick = () => this.goTo(i);
            indicators.appendChild(dot);
        }

        // 虚拟化：只维护三个 slide（prev, current, next）在 DOM 中
        this.slidePool = [this.createSlideElement(), this.createSlideElement(), this.createSlideElement()];
        this.poolPos = { prev: 0, current: 1, next: 2 };
        this.poolIndices = { prev: this.mod(State.carouselIndex - 1), current: State.carouselIndex, next: this.mod(State.carouselIndex + 1) };

        this.slidePool.forEach(s => container.appendChild(s));
        // 初始化三个 slide 的图片
        this.updatePoolImages(State.carouselIndex);

        // 绑定左右控制按钮
        const prevBtn = document.querySelector('.carousel-control.prev');
        const nextBtn = document.querySelector('.carousel-control.next');
        if (prevBtn) prevBtn.onclick = () => this.goTo(State.carouselIndex - 1);
        if (nextBtn) nextBtn.onclick = () => this.goTo(State.carouselIndex + 1);
        this.startAutoPlay();
    },
    // 创建单个 slide DOM（占位，图片使用 data-src 懒加载策略）
    createSlideElement() {
        const slide = Utils.createEl('div', { className: 'carousel-slide hidden-slide' });
        const img = Utils.createEl('img', { alt: 'carousel image' });
        img.loading = 'lazy';
        slide.appendChild(img);
        return slide;
    },
    // 模块内取模函数
    mod(n) { const len = CONFIG.TOTAL_IMAGES; return ((n % len) + len) % len; },
    // 根据当前索引设置三个池中图片的 src
    updatePoolImages(centerIndex) {
        const prevIndex = this.mod(centerIndex - 1);
        const nextIndex = this.mod(centerIndex + 1);
        this.poolIndices = { prev: prevIndex, current: centerIndex, next: nextIndex };
        const map = [prevIndex, centerIndex, nextIndex];
        this.slidePool.forEach((slide, i) => {
            const img = slide.querySelector('img');
            const idx = map[i];
            img.dataset.src = getImageUrl(idx + 1);
            img.alt = `Image ${idx + 1}`;
            // 立即加载中间图片，懒加载其他两张
            if (i === 1) img.src = img.dataset.src; else img.removeAttribute('src');
            // 设置类
            slide.classList.toggle('active', i === 1);
            slide.classList.toggle('hidden-slide', i !== 1);
        });
        // 观察 pool 中的图片以便它们在进入视口时加载
        this.slidePool.forEach(s => { const img = s.querySelector('img'); LazyLoadModule.observe(img); });
        // 更新指示点视觉状态
        const dots = document.querySelectorAll('.indicator');
        dots.forEach(d => d.classList.remove('active'));
        const activeDot = document.querySelector(`.indicator[data-index='${centerIndex}']`);
        if (activeDot) activeDot.classList.add('active');
    },
    // 跳转到指定索引的幻灯片
    goTo(index) {
        const target = this.mod(index);
        if (target === State.carouselIndex) return;
        // 计算方向（1 = forward, -1 = backward）
        const direction = (target - State.carouselIndex + CONFIG.TOTAL_IMAGES) % CONFIG.TOTAL_IMAGES <= CONFIG.TOTAL_IMAGES / 2 ? 1 : -1;
        State.carouselIndex = target;
        // 重新填充池图片（保持中心为当前）
        this.updatePoolImages(State.carouselIndex);
    },
    startAutoPlay() {
        State.autoPlayTimer = setInterval(() => this.goTo(State.carouselIndex + 1), CONFIG.CAROUSEL_DELAY);
    },
    stopAutoPlay() { clearInterval(State.autoPlayTimer); }
};

// 画廊模块（分页加载 + 按需渲染）
const GalleryModule = {
    PAGE_SIZE: 50,
    currentPage: 0,
    init() {
        const grid = document.querySelector('#gallery .gallery-grid');
        if (!grid) return;
        grid.innerHTML = '';
        this.initModal();
        this.renderPage(0);
        this.addLoadMoreButton();
    },
    // 渲染指定页（0-based）
    renderPage(pageIndex) {
        const grid = document.querySelector('#gallery .gallery-grid');
        const start = pageIndex * this.PAGE_SIZE + 1;
        const end = Math.min(CONFIG.TOTAL_IMAGES, (pageIndex + 1) * this.PAGE_SIZE);
    // 对于首屏体验，立即加载本页前若干张图片，其余继续懒加载
    const immediateLoadCount = CONFIG.immediateLoadCount || 12; // 可按需调整
        for (let i = start; i <= end; i++) {
            const item = Utils.createEl('div', { className: 'gallery-item card-hover', 'data-index': i-1 });
            const img = Utils.createEl('img', { alt: `Image ${i}` });
            img.loading = 'lazy';
            // 使用 setAttribute 确保 data-src 真正成为属性（Object.assign 无法可靠设置带横线的属性）
            const dataSrcUrl = getImageUrl(i);
            img.setAttribute('data-src', dataSrcUrl);
            const caption = Utils.createEl('div', { className: 'caption-container' }, [
                Utils.createEl('div', { className: 'gallery-caption', textContent: `小橘子 #${i}` })
            ]);
            item.appendChild(img);
            item.appendChild(caption);
            // 点击行为：移动端直接跳转到图片原图，桌面端打开模态
            item.onclick = (e) => {
                // 防止点击 caption 触发其他行为
                e.preventDefault();
                const idx = parseInt(item.dataset.index, 10);
                if (window.innerWidth <= 768) {
                    // 手机/小屏设备：跳转到图片原始 URL（全尺寸）
                    window.location.href = getImageUrl(idx + 1);
                } else {
                    // 桌面端：在 modal 中展示合适尺寸
                    this.openModal(idx);
                }
            };
            grid.appendChild(item);
            // 立即加载本页前 immediateLoadCount 张以提升首屏体验
            if (i - start < immediateLoadCount) {
                // 立即加载前几张：直接使用生成的 URL（dataSrcUrl），避免依赖 dataset
                img.src = dataSrcUrl;
            }
            LazyLoadModule.observe(img);
        }
        this.currentPage = pageIndex;
    },
    addLoadMoreButton() {
        const container = document.querySelector('#gallery');
        if (!container) return;
        // 移除已有按钮
        const existing = document.getElementById('load-more-btn');
        if (existing) existing.remove();
        if ((this.currentPage + 1) * this.PAGE_SIZE >= CONFIG.TOTAL_IMAGES) return; // 全部已加载
        const btn = Utils.createEl('button', { id: 'load-more-btn', className: 'mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg' }, ['加载更多']);
        btn.onclick = () => {
            this.renderPage(this.currentPage + 1);
            this.addLoadMoreButton();
        };
        container.appendChild(btn);
    },
    // 初始化大图查看模态框（桌面使用）
    initModal() {
        if (this.modal) return;
        this.modal = Utils.createEl('div', {
            style: 'display:none; position:fixed; z-index:10000; left:0; top:0; width:100%; height:100%; background:rgba(10,25,47,0.95); align-items:center; justify-content:center; cursor:zoom-out;'
        });
        this.modalImg = Utils.createEl('img', {
            style: 'max-width:90%; max-height:90%; object-fit:contain; border-radius:12px; box-shadow: 0 8px 25px rgba(0,0,0,0.5);'
        });
        this.closeBtn = Utils.createEl('span', {
            innerHTML: '&times;',
            style: 'position:absolute; top:20px; right:40px; color:#64D2FF; font-size:50px; cursor:pointer; font-weight:bold;'
        });
        this.modal.appendChild(this.modalImg);
        this.modal.appendChild(this.closeBtn);
        document.body.appendChild(this.modal);
        this.closeBtn.onclick = () => this.closeModal();
        this.modal.onclick = (e) => { if (e.target === this.modal) this.closeModal(); };
    },
    openModal(index) {
        this.modalImg.src = getImageUrl(parseInt(index) + 1);
        this.modal.style.display = 'flex';
    },
    closeModal() {
        this.modal.style.display = 'none';
    }
};

// 多媒体模块：音乐与视频播放
const MediaModule = {
    init() {
        this.setupAudio();
        this.setupVideo();
    },
    // 设置背景音乐播放逻辑
    setupAudio() {
        const btn = document.getElementById('musicControlBtn');
        const icon = document.getElementById('musicIcon');
        const player = document.getElementById('myAudioPlayer');
        const prev = document.getElementById('prevBtn');
        const next = document.getElementById('nextBtn');
        const playlist = [
            "https://c.chenbq.xyz/%E6%83%85%E7%BB%AA%E6%8C%91%E6%8B%A8.mp3",
            "https://c.chenbq.xyz/%E6%9A%97%E9%87%8C%E7%9D%80%E8%BF%B7%20.mp3",
            "https://c.chenbq.xyz/%E7%9C%9F%E7%9A%84%E7%88%B1%E4%BD%A0.m4a",
            "https://c.chenbq.xyz/%E6%AD%8C%E7%BB%8A%20(10).m4a",
            "https://c.chenbq.xyz/%E6%AD%8C%E5%8D%95%20(9).m4a",
            "https://c.chenbq.xyz/%E4%BC%9A%E5%91%BC%E5%90%B8%E7%9A%84%E7%97%9B.mp3"
        ];
        let idx = 0;
        player.src = playlist[idx];
        
        const updateUI = () => { icon.className = player.paused ? 'fa fa-play' : 'fa fa-pause'; };
        btn.onclick = () => { player.paused ? player.play() : player.pause(); updateUI(); };
        player.onplay = updateUI; player.onpause = updateUI;
        
        // 自动播放下一首
        player.onended = () => { idx = (idx + 1) % playlist.length; player.src = playlist[idx]; player.play(); };
        prev.onclick = () => { idx = (idx - 1 + playlist.length) % playlist.length; player.src = playlist[idx]; player.play(); updateUI(); };
        next.onclick = () => { idx = (idx + 1) % playlist.length; player.src = playlist[idx]; player.play(); updateUI(); };
    },
    // 设置视频播放逻辑
    setupVideo() {
        const player = document.getElementById('videoPlayer');
        const btn = document.getElementById('videoPlayPauseBtn');
        const prev = document.getElementById('prevVideoBtn');
        const next = document.getElementById('nextVideoBtn');
        let idx = 0;
        
        const load = (i) => {
            idx = (i + CONFIG.TOTAL_VIDEOS) % CONFIG.TOTAL_VIDEOS;
            player.src = getVideoUrl(idx + 1);
            player.load();
        };
        load(0);
        btn.onclick = () => { player.paused ? player.play() : player.pause(); };
        player.onplay = () => btn.className = 'fa fa-pause';
        player.onpause = () => btn.className = 'fa fa-play';
        player.onended = () => load(idx + 1);
        prev.onclick = () => load(idx - 1);
        next.onclick = () => load(idx + 1);
    }
};

// Debug helper: 在控制台打印前 count 个图片和视频 URL，方便和 R2 控制台中的 URL 对比
function debugListSampleUrls(count = 10) {
    console.group('Sample image URLs');
    for (let i = 1; i <= Math.min(count, CONFIG.TOTAL_IMAGES); i++) {
        console.log(i, getImageUrl(i));
    }
    console.groupEnd();
    console.group('Sample video URLs');
    for (let i = 1; i <= Math.min(count, CONFIG.TOTAL_VIDEOS); i++) {
        console.log(i, getVideoUrl(i));
    }
    console.groupEnd();
}
// 不在全局暴露调试函数
// window.debugListSampleUrls = debugListSampleUrls;

// 页面加载完成后的初始化流程
window.addEventListener('load', async () => {
    // 1. 初始化安全验证
    SecurityModule.init();
    
    // 2. 处理加载动画淡出
    setTimeout(() => {
        const l = document.getElementById('loader');
        if (l) {
            l.style.opacity = '0';
            setTimeout(() => l.style.display = 'none', 500);
        }
    }, 800);
    
    // 3. 启动各项功能模块
    BackgroundModule.init();
    await InfoModule.init();
    // 初始化懒加载观察器
    LazyLoadModule.init();
    CarouselModule.init();
    GalleryModule.init();
    MediaModule.init();
    
    // 4. 实现元素入场动画 (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('opacity-100', 'translate-y-0');
                e.target.classList.remove('opacity-0', 'translate-y-8');
                observer.unobserve(e.target); // 仅执行一次动画
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.card-hover').forEach(c => {
        c.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
        observer.observe(c);
    });

});
