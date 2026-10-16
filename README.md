# pi 跨机器配置同步

本仓库保存 pi（@earendil-works/pi-coding-agent）的用户级配置，用于在新电脑上安装 pi 后一键恢复完整环境。

## 仓库内容

| 文件 / 目录 | 用途 |
|---|---|
| `skills/` | 全部技能（grilling、coding-principles、go-zero-spec、novel 系列、前端设计系列等） |
| `extensions/` | 自定义扩展（tab-completion-indicator.ts 标签页状态、rtk.ts、pi-permission-system 配置） |
| `settings.json` | 默认模型、thinking level、默认工具、packages 列表 |
| `mcp.json` | MCP 服务器（exa、context7、searchcode） |
| `models.json` / `models-store.json` | 自定义 provider 与模型定义 |
| `open-tui.json` | pi-open-tui 界面配置 |
| `AGENTS.md` | 全局 agent 指令 |
| `auth.example.json` | 认证文件格式示例 |

**不包含（敏感或运行时数据）**：`auth.json`（API key）、`mcp-auth.json`、`sessions/`、`run-history.jsonl`。

## 新电脑恢复步骤

1. 安装 pi：

   ```bash
   npm install -g @earendil-works/pi-coding-agent
   ```

2. 克隆本仓库到 pi 的用户配置目录（Windows 默认 `~\.pi\agent`，macOS/Linux 为 `~/.pi/agent`）：

   ```bash
   # Windows (PowerShell)
   git clone https://github.com/jiyindaohanli/pi-skills-other-configurations.git "$env:USERPROFILE\.pi\agent"

   # macOS / Linux
   git clone https://github.com/jiyindaohanli/pi-skills-other-configurations.git ~/.pi/agent
   ```

   如果该目录已存在，改为把仓库内容复制进去覆盖合并。

3. 认证（二选一）：

   ```bash
   # 方式 A：直接写 auth.json
   cp auth.example.json auth.json   # 然后填入真实 API key
   # Windows: Copy-Item auth.example.json auth.json

   # 方式 B：交互式登录
   pi auth login
   ```

4. 启动 `pi` —— settings.json 里声明的 packages（pi-open-tui、rpiv-todo、rpiv-ask-user-question、pi-lsp、pi-subagents、pi-permission-system）会在首次启动时自动安装。

## 日常同步

在任意一台机器上更新了 skills / extensions / 配置后：

```bash
cd ~/.pi/agent   # （Windows: $env:USERPROFILE\.pi\agent）
git add -A && git commit -m "sync" && git pull --rebase && git push
```

其他机器上 `git pull` 即可。注意不要把新的 `auth.json` 意外提交（已在 .gitignore 中排除）。
