#!/bin/bash
# быстрая сборка: автокавычки + проверка
cd /data/codelearn && python3 tools/fix-yaml.py content/*.yaml && NODE_PATH=/vercel/sandbox/node_modules node tools/build-content.cjs 2>&1 | tail -n 8
