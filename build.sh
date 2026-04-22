#!/bin/bash
# ============================================
#  构建脚本 — 将 .env 中的配置注入到 theme.js
#  用法: ./build.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE=".env"
TARGET="js/theme.js"

# 检查 .env 是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 未找到 .env 文件"
    echo "   请复制 .env.example 为 .env 并填写配置："
    echo "   cp .env.example .env"
    exit 1
fi

# 读取 .env 中的值（跳过注释和空行）
AI_PROVIDER=$(grep -E '^AI_PROVIDER=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)
AI_API_KEY=$(grep -E '^AI_API_KEY=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)
AI_MODEL=$(grep -E '^AI_MODEL=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)

# 校验
if [ -z "$AI_PROVIDER" ] || [ -z "$AI_API_KEY" ] || [ -z "$AI_MODEL" ]; then
    echo "❌ .env 中缺少必要配置项（AI_PROVIDER / AI_API_KEY / AI_MODEL）"
    exit 1
fi

# 注入占位符
sed -i '' "s|__AI_PROVIDER__|${AI_PROVIDER}|g" "$TARGET"
sed -i '' "s|__AI_API_KEY__|${AI_API_KEY}|g" "$TARGET"
sed -i '' "s|__AI_MODEL__|${AI_MODEL}|g" "$TARGET"

echo "✅ 构建完成！AI 配置已注入到 $TARGET"
echo "   Provider: $AI_PROVIDER"
echo "   Model:    $AI_MODEL"
echo "   Key:      ${AI_API_KEY:0:8}...（已隐藏）"
