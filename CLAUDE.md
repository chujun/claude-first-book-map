# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

全球书籍地图应用 - 展示全球经典书籍及其对应国家/地区。

基于长时间代理系统开发模式：
- 每次只实现一个功能
- 每次提交代码并更新进度
- 通过 features.json 跟踪待办事项

## Commands

```bash
# 启动开发服务器
cd /root/ai/claudecode/first/book-map
python3 -m http.server 8080 --bind 0.0.0.0

# 运行测试
PYTHONPATH=/root/ai/claudecode/first/long-running-agent python3 /root/ai/claudecode/first/long-running-agent/tests/test_agent_system.py
```

## Architecture

```
book-map/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── app.js         # 应用逻辑
│   └── book-data.js   # 书籍数据
├── data/              # 数据目录
├── features.json      # 功能列表（待办事项）
├── claude-progress.txt # 进度跟踪
└── CLAUDE.md         # 项目说明
```

## Development Workflow

1. 从 features.json 选择一个 `passes: false` 的功能
2. 实现该功能
3. 更新 features.json 中该功能的 passes 为 true
4. 更新 claude-progress.txt
5. Git 提交

## Current Tasks

正在开发：获取豆瓣前1000本图书数据
