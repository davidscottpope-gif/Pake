# GitHub Actions 使用指南

<div align="center">

[English](github-actions-usage.md) · **中文**

</div>

无需本地安装开发工具，在线构建 Pake 应用。

## 快速步骤

1. [打开这个个人分支](https://github.com/davidscottpope-gif/Pake/tree/feature/macos-only-ts-js-cleanup)
2. 在个人仓库里打开 Actions 页面，选择 `feature/macos-only-ts-js-cleanup` 分支和 `Build App With Pake CLI`，按 [CLI 选项](cli-usage_CN.md) 填写表单后点击 `Run Workflow`

   ![Actions 界面](https://raw.githubusercontent.com/tw93/static/main/pake/action.png)

3. 出现绿色勾号就是构建成功，点击工作流名称进入详情，在 `Artifacts` 部分下载应用

   ![构建成功](https://raw.githubusercontent.com/tw93/static/main/pake/action2.png)

首次运行要建立依赖缓存，大约 10-15 分钟，之后用上缓存大约 5 分钟，缓存完整时为 400-600MB。

## 提示

- 当网站通过新窗口打开登录、考试或其他流程时，启用 `Allow sites to open new windows`
- 如果构建失败，清理 Actions 缓存后重试

## 相关文档

- [CLI 使用指南](cli-usage_CN.md)
- [高级用法](advanced-usage_CN.md)
