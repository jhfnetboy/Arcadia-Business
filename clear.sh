# Delete .next folder
rm -rf .next
# Delete node_modules/.cache folder
rm -rf node_modules/.cache
pnpm install
pnpm build
