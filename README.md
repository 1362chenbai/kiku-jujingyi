<p align="center">
  <font color="#aaaaaa">📢 欢迎来到 Kiku 图库 · 请先关注本项目以获取最新动态</font>
</p>

<p align="center">
  <img src="https://c.chenbq.xyz/ju%20(894).png" width="80" style="border-radius: 50%;">
  <br>
  <h1 style="margin-top: 10px;">✨ Ju Project</h1>
</p>

<p align="center">
  <img src="https://c.chenbq.xyz/ju%20(235).png" width="100%" alt="Project Banner">
</p>

<p align="center">
  <blockquote style="border-left: 5px solid #F38020; padding-left: 15px;">
    <b style="font-size: 1.2em;">kiku图库</b><br>
    <i style="color: #666;">专注于鞠婧祎美照、视频与音乐的沉浸式小站。</i>
  </blockquote>
</p>

<p align="center">
  <a href="https://space.bilibili.com/11454050?spm_id_from=333.937.0.0">
    <img src="https://img.shields.io/badge/Bilibili-小狗儿enjoy-00aeec?style=for-the-badge&logo=bilibili&logoColor=white" alt="Bilibili">
  </a>
  <a href="https://www.douyin.com/user/self?from_tab_name=main&modal_id=7632889347741682990">
    <img src="https://img.shields.io/badge/抖音-军阀柔祎祎-000000?style=for-the-badge&logo=tiktok&logoColor=white" alt="Douyin">
  </a>
</p>

<p align="center">
  <small>本项目由 <b style="color: #F38020;">小狗儿enjoy</b> 联合 <b style="color: #F38020;">军阀柔祎祎</b> 共同编写维护</small>
</p>

---

## 🚀 快速部署 (Quick Deploy)

<p align="center">
  <img src="https://c.chenbq.xyz/ju%20(894).png" width="25" align="center"> 
  <b style="font-size: 1.1em;">点击下方按钮，即可引导你完成项目的部署流程：</b>
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/1362chenbai/ju-0001">
    <img src="https://img.shields.io/badge/Deploy_to-Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Deploy Button">
  </a>
</p>

> **💡 提示**：点击按钮后，请在 Cloudflare 页面中选择 `Connect to Git`，然后在列表中找到并选择你的仓库 `ju` 即可。

---

## 🛠️ 方式一： 手动部署指南 (Manual Setup)

如果你希望进行更精细的配置，请参考以下步骤：

1. **登录控制台**：访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. **创建应用**：进入 `Workers & Pages` $\rightarrow$ `Create application` $\rightarrow$ `Pages` $\rightarrow$ `Connect to Git`。
3. **选择仓库**：选择本项目 `ju`。
4. **构建设置 (Build settings)**：
   - **Framework preset**: 选择 `None`
   - **Build command**: 保持**留空**
   - **Build output directory**: 输入 `/`
5. **完成**：点击 `Save and Deploy`，稍等片刻，属于你的美学空间即可上线！
   
### 💻 方式二：使用 Wrangler CLI (推荐开发者使用)，
 <br>首先下载好整个项目包，解压桌面或在自定义目录。
     
1. **下载powershell终端命令工具**
2. **打开powershell终端命令工具，输入 npm install -g wrangler@latest   （等待wrangler安装完成） **
3. ** powershell终端命令工具下定位 项目根目录下 （cd 项目目录地址按回车完成定位，注意cd后面要跳一个空格再输项目地址）**
4. ** powershell终端命令输入 wrangler pages deploy ./ **
5. **（等待命令部署完成，完成后有链接生成，复制在浏览器打开。由于cloudflare分配的域名不稳定，可以自行在   cloudflare上绑定自定义域名）**：
---

## 📁 项目结构

| 文件名 | 说明 |
| :--- | :--- |
| `index.html` | 项目入口 |
| `style.css` | 核心美学样式表 |
| `script.js` | 交互逻辑 |
| `favicon.png` | 网站品牌图标 |
| `wrangler.toml` | Cloudflare 配置 |

---

<p align="center">
  <font color="#aaaaaa">Made with ✨ and Passion</font>
</p>
