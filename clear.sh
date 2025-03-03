# 删除 .next 文件夹
rm -rf .next
# 删除 node_modules/.cache 文件夹
rm -rf node_modules/.cache
pnpm install
pnpm build
