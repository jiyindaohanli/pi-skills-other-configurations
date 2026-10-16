---
name: go-zero-spec
description: 强制执行 go-zero API 项目规范，包括只从 api 文件生成接口代码、禁止手工修改生成文件、分层实现业务，以及统一使用 goZero 命名样式生成首字母小写驼峰式文件名。用于开发、修改、生成或审查 go-zero API 项目。
---

# go-zero 开发规范

严格遵守以下规则：

1. 只在 `api/*.api` 中定义 API 类型、结构体和路由；多个模块必须由 `api/main.api` 使用 `import` 引入。

2. API 发生新增、修改或删除时，先编辑 `.api` 文件，再执行代码生成。

3. 所有 goctl API 代码生成必须显式使用 `--style goZero`：

   ```powershell
   goctl api go -api api/main.api -dir . --style goZero
   ```

   如果项目提供统一生成脚本，优先使用该脚本。

4. 禁止使用默认 `gozero` 样式生成全小写文件名。

5. goctl 生成的多单词文件名必须使用首字母小写驼峰式，例如：

   - `createArticleLogic.go`
   - `updateOrganizationAnnotationHandler.go`
   - `serviceContext.go`

6. 禁止手工修改自动生成文件的内容，包括：

   - `internal/handler/routes.go`
   - `internal/types/types.go`
   - `internal/handler/**`

   需要变化时，修改 `.api` 文件后使用 goctl 重新生成。

7. 所有业务逻辑只能写在 `logic` 层；handler 只负责参数接收和结果返回；数据访问写在 `repository` 层。

8. 新增接口必须按以下顺序进行：

   修改 `.api` → 使用 `--style goZero` 生成 → 编写 logic

9. 接口返回格式必须统一为 JSON：

   - 成功：直接返回业务结构体
   - 失败：固定返回 `{"error": "错误信息"}`

   禁止返回纯文本错误。

如果用户要求修改接口，只修改 `.api` 文件并重新生成。

如果用户要求编写业务逻辑，只修改对应的 logic 文件。

绝对不要手工编辑 handler、routes.go 或 types.go 的内容。