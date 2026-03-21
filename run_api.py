#!/usr/bin/env python3
"""
全球书籍地图 API 启动脚本
"""

import uvicorn
import os

def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    print(f"启动全球书籍地图 API...")
    print(f"访问地址: http://{host}:{port}")
    print(f"API 文档: http://{host}:{port}/docs")

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
