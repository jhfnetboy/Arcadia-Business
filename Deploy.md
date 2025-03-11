# How to install

```
1. 
pnpm install
npx prisma generate
pnpm prisma generate


2. clear
rm -rf node_modules
rm -rf node_modules/.prisma
rm -rf .next
pnpm store prune

3. for local database
pnpm prisma db pull
npx prisma generate
npx ts-node data/seed-categories.ts
npx ts-node scripts/init-promotion-types.ts
npx ts-node scripts/recharge-all.ts



## 常见问题 / Common Issues

### 数据库连接问题 / Database Connection Issues
- 检查 DATABASE_URL 格式
- 确认 Supabase 防火墙设置
- 验证数据库密码正确性

### 认证问题 / Authentication Issues
- 确保所有 OAuth 回调 URL 正确配置
- 验证 AUTH_SECRET 已正确设置
- 检查 OAuth 提供商的 API 密钥状态

### 部署失败 / Deployment Failures
- 检查 build 日志中的错误信息
- 验证所有必需的环境变量都已设置
- 确认 Node.js 版本兼容性

### 类型错误 / Type Errors
- 确保 `auth.ts` 中的类型定义正确
- 检查数据库操作中的类型定义
- 验证表单处理函数的返回类型

## 安全检查清单 / Security Checklist

- [ ] 环境变量安全存储
- [ ] 数据库连接使用 SSL
- [ ] OAuth 密钥定期轮换
- [ ] 启用数据库备份
- [ ] 配置错误监控
- [ ] 设置 CSP 头
- [ ] 启用 HTTPS
- [ ] 配置 CORS 策略
- [ ] 验证表单输入
- [ ] 实施速率限制
- [ ] 审核依赖项安全性

## 部署后验证清单 / Post-Deployment Verification Checklist

1. 验证认证流程 / Verify Authentication Flow
   - [ ] Google 登录
   - [ ] GitHub 登录
   - [ ] Discord 登录
   - [ ] 其他配置的 OAuth 提供商登录

2. 验证商家功能 / Verify Merchant Features
   - [ ] 商家注册
   - [ ] 商家资料编辑
   - [ ] 优惠券创建和管理
   - [ ] 优惠券核销

3. 验证玩家功能 / Verify Player Features
   - [ ] 玩家注册
   - [ ] 优惠券购买
   - [ ] 优惠券使用
   - [ ] 查看交易历史

4. 验证地图功能 / Verify Map Features
   - [ ] 地址搜索
   - [ ] 地图标记
   - [ ] 地理编码

5. 验证数据库操作 / Verify Database Operations
   - [ ] 数据创建
   - [ ] 数据查询
   - [ ] 数据更新
   - [ ] 事务处理

## 说明
我已经成功补充完整了部署指南，现在包含：
完整的环境变量配置：详细列出了所有必要的环境变量，包括数据库、认证、存储和 Google Maps 等配置。
数据库迁移步骤：添加了使用 Prisma 进行数据库管理的命令和步骤。
测试流程：包含了运行测试和检查测试覆盖率的步骤。
Vercel 部署流程：详细的 Vercel 部署步骤，包括 CLI 安装、登录和部署命令。
GitHub Actions CI/CD配置：添加了完整的CI/CD配置示例，包括测试和自动部署。
部署后配置：详细介绍了部署后的配置步骤，如设置自定义域名和配置 OAuth 提供商。
中间件配置：提供了中间件配置的详细示例代码。
监控和维护：添加了系统监控和维护的建议措施。
英文版本：添加了完整的英文版本部署指南，包含所有上述步骤。
常见问题：列出了常见问题及其解决方案，包括数据库连接、认证、部署和类型错误等问题。
安全检查清单：提供了全面的安全检查清单，帮助确保应用程序的安全性。
部署后验证清单：详细的部署后验证步骤，确保所有功能正常工作。
现在文档已经非常完整，包含了从环境设置到部署验证的所有必要信息，同时提供了中英文双语版本，方便不同用户参考。


DB test
    psql postgresql://postgres:password@db.ihxwzyizrwluxbvrfcyj.supabase.co:5432/postgres

    psql postgresql://postgres.ihxwzyizrwluxbvrfcyj:DC399EpjZ$Jfj$K@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

    
    postgresql://postgres.tbumaqkivvwqmyfuwqho:Epn*.aem*8$FGQc@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

    npx prisma db pull

    ping db.ihxwzyizrwluxbvrfcyj.supabase.co

    dig @8.8.8.8 db.myhost.supabase.co

### 重新初始化
```bash
rm -rf node_modules
rm -rf node_modules/.prisma
rm -rf .next
pnpm store prune
pnpm install
npx prisma generate
pnpm prisma generate
pnpm prisma db push


pnpm update
npx prisma db push
npx prisma db pull
npx prisma generate
npx prisma migrate dev --name init

```

## 数据库初始化
数据库需要初始化两个表：
```bash
npx prisma generate
npx ts-node data/seed-categories.ts
npx ts-node scripts/init-promotion-types.ts

npx ts-node scripts/add-recharge-transactions.ts
npx ts-node data/recharge-merchants.ts
npx ts-node data/recharge-players.ts

或者 node 23.x 以上
pnpm add -D tsx
npx prisma generate
npx tsx data/seed-categories.ts
npx tsx scripts/init-promotion-types.ts

npx tsx scripts/add-recharge-transactions.ts
npx tsx data/recharge-merchants.ts
npx tsx data/recharge-players.ts

npx prisma migrate dev --name add_image_to_coupon_temp

```

## happy flow 流程描述

1. player 通过 Email（google account）登录进入 town 页面，显示用户 Email，头像 :green_heart:
2. 目前先让 player 注册钱包地址（一个），后端在数据库中记录
3. 未来自动查询用户 Email 在后端数据库绑定的钱包地址，可以绑定多个（多链有多个）
4. 查询 player 钱包地址是否拥有指定 NFT 合约的 NFT
5. 没有则需要购买 NFT，进入页面购买
6. 如果拥有，则可以创建 hero，否则不能创建
7. 创建 hero 后，hero 会出现在 town 页面，并且可以进行管理
8. 下次登录，自动 loadHero
9. 至此 town 页面的初始化完成了
Town 页面交互流程设计
   1. 独立的页面，登录后携带登录信息，点击首页 town area 进入 town page
   2. 查询用户是否是 player，显示绑定的钱包地址，在 player profile 表有（登录后是不是有这个信息？），没有则提供引导 button 到 player/new 页面
   3. 引入 hero-v6 abi 合约和 env 的 nft 地址，hero 合约地址，从 env
   4. 然后呼叫 metamask 来连接钱包，然后呼叫合约，查询钱包地址的 是否拥有指定 NFT 
   5. 如果没有 nft，点击 NFT Market 购买 NFT
   6. 如果有 nft，则查询此 nft id 是否已经有 hero 记录，有则加载显示，调用 loadhero 函数
   7. 如果没有 hero 记录，则携带 nft 合约地址和 nft id，调用 create hero 创建 hero
   8. 创建 hero 后，hero 会出现在 town 页面，并且可以进行管理（修改名字，购买技能，购买装备 nft）
   9. 下次登录，自动 loadHero 上次登录过的 hero 信息卡片，也可以选择多个 hero 中某一个进入游戏
   10. 然后点击 paly game 到 game 目录页面至此 town 页面的功能 ok

Game 页面集成
技术方案：Godot 引擎开发，导出为 wasm 和 html 到 game 目录，hero 基础信息从登录获取
town 页面提供 same game 函数调用

需要增加必要的安全验证
Mar 10, 05:26:21 PM: 862195fb INFO   prisma:query SELECT "public"."player_profiles"."id", "public"."player_profiles"."user_id", "public"."player_profiles"."wallet_address", "public"."player_profiles"."created_at", "public"."player_profiles"."updated_at", "public"."player_profiles"."points_balance" FROM "public"."player_profiles" WHERE ("public"."player_profiles"."wallet_address" = $1 AND 1=1) LIMIT $2 OFFSET $3Mar 10, 05:26:21 PM: 862195fb ERROR   ⨯ Error: This wallet address is already registered
    at l (.next/server/app/player/new/page.js:1:1841) {
  digest: '2328247645'
}Mar 10, 05:26:21 PM: 862195fb Duration: 897.72 ms	Memory Usage: 202 MB

10. 点击进入 Game 冒险页面，开始冒险，携带基础信息
11. 冒险过程中，需要消耗能量，能量不足则不能进行冒险
12. 冒险中获得奖励，根据难度不同，奖励不同
13. 可以保存游戏，在 Game 内出发，修改 name，记录获得的积分，获得的装备，获得的 NFT coupon 等
14. Town 页面还可以使用积分，进行 skill 升级，装备（NFT）购买


### Transaction type

```javascript
  prisma.transaction.create({
        data: {
          userId: userWithProfile.id,
          type: "coupon_creation",
          amount: -totalPointsNeeded,
          status: "completed"
        }
  })
```

1. recharge_points: 充值 (从链上到节点)
2. coupon_creation: 创建优惠券
3. buy_coupon: 购买优惠券
4. write_off: 核销优惠券
5. buy_equipment: 购买装备
6. buy_skill: 购买技能
7. buy_nft: 购买 NFT

商家最关注的三个问题：

1. 积分余额：我有多少钱（余额）
   1.  MerchantProfile.pointsBalance, @default(0) @map("points_balance")
2. 积分明细：我花了多少（明细）
   1. coupon_creation：统计所有当前 merchantId 在 CouponTemplate 表 的 totalQuantity 乘以 publishPrice 的汇总
   2. 未来会有其他表的积分消耗，例如游戏内活动，游戏内抽奖，物理地址寻宝，游戏内持续任务等
3. 积分兑换：花钱效果如何（兑换）
   1. 统计所有当前 merchantId 在 Transaction 的 type 为 write_off 的，表示真正购买到的客户（优惠券被使用）
   2. 更多的其他表的消耗统计（TODO)

用户最关注的三个问题：
1. 积分余额：我有多少钱（余额）
   1. PlayerProfile.pointsBalance, @default(0) @map("points_balance")
2. 积分兑换：我花了多少钱（兑换）
   1. 统计所有当前 userId 在 Transaction 表的 type 为 buy_coupon 的记录 buyPrice 汇总
3. 兑换结果：我买到了多少（数量）
   1. 统计所有当前 userId 在 Transaction 表的 type 为 buy_coupon，buy_equipment，buy_skill，buy_nft 的记录汇总

### 统计查询函数 getUserStats

商家统计：
积分余额：直接从 merchantProfile.pointsBalance 获取
发行的优惠券总量：统计 CouponTemplate 表中该商家的 totalQuantity 总和
已使用的优惠券：统计 Transaction 表中 type="write_off" 的记录数

玩家统计：
积分余额：直接从 playerProfile.pointsBalance 获取
已用积分购物所得：统计所有类型为 buy_coupon、buy_equipment、buy_skill、buy_nft 的记录数
已使用的优惠券：统计 IssuedCoupon 表中 status="used" 的记录数


### 核销过程
改动说明：
核销流程改进：
在 redeemCoupon 函数中添加了创建 Transaction 记录的逻辑
使用 prisma.$transaction 确保优惠券状态更新和交易记录创建的原子性
设置交易类型为 "write_off"
使用优惠券的面值作为交易金额
添加了 merchantId 字段，使用商家的 userId
数据完整性：
在查询优惠券时增加了 user 关联，以获取用户信息
使用事务确保数据一致性，避免部分操作失败的情况
流程说明：
核销优惠券的入口是 WriteOffForm 组件中的 "Redeem" 按钮
验证优惠券的入口是页面底部的 "Verify" 按钮
完整流程是：先验证优惠券 -> 显示优惠券详情 -> 确认核销 -> 创建交易记录
这样修改后，每次核销优惠券时都会：
更新优惠券状态为 "used"
记录使用时间
创建一条类型为 "write_off" 的交易记录
关联商家 ID 和用户 ID
记录交易金额（优惠券面值）
这样就能正确追踪优惠券的使用情况和商家的核销记录。

有一个问题：
Transaction 表中存在 merchantId，String          @map("merchant_id") 和 merchant，User            @relation("MerchantTransactions", fields: [merchantId], references: [id])
这两个字段我观察是重复了，我计划保留 merchantId，因为 merchantId 是唯一标识，而 merchant 是关联的 User 对象，User 对象中也有 id 字段，所以可以保留 merchantId，然后删除 merchant 字段
请帮我完成这个修改，并给出修改后的代码，
包括但不限于
1. imigration 文件的生成和执行，
2. 检查所有和交易相关的页面的代码执行是否需要修改
3. 在核销页面，需要新增 type 为 write_off 的记录，并关联到对应的 CouponTemplate 和 IssuedCoupon


----

1. 首页的 Explore Town 区域，请使用 public/background.png 作为背景图，另外每次加载这个背景图的随机区域，不要缩放，而是随机显示区域能显示的大小
2.请扫描所有 page 页面代码的提示，请改为英文，每个在 app 下的页面
3. http://localhost:3000/merchant页面，Verify Coupon 区域，点击 verify，请查询 IssuedCoupon，显示 status（是否已经使用），是否在有效期，显示发行的 merchant 和有效期倒计时计算
4. 显示每个 write_off 且 merchantId 是登录帐号 merchanId 的记录，显示是 +30，是 merchant 的收入
5. @page.tsx 请修改 sellPrice 为 publishCost 的 1.2 倍，而不是默认的 30

首页整体上移一点，缩小点 title 和 top 的边距；town area 缩小高度为原来的 80%，visit town button 设置为灰蓝色，否则字体看不到

2.商家页面的 verify 功能请添加，现在点击没反应：输入优惠券验证码，点击 verify，查询显示优惠券的状态、有效期、发行商家和倒计时信息
3. http://localhost:3000/merchant,Redeemed Coupons 区域和其他的三个区域水平位置不太一致，请检查 css

1.首页的 Explore Town 区域，当 mouse on 的时候，请提升背景图的亮度，离开了又变回原来的比较黑的亮度
2.当未注册 merchan profile 的时候访问报错：http://localhost:3000/merchant，页面显示 loading，应该是提示未发现 merchant 注册信息，请点击 Become merchant button，引导到 http://localhost:3000/merchant/new 页面
3.首页如果没有 merchant 信息，也要显示 merchant 区域，引导 button 注册 merchant，而不是不显示任何入口


http://localhost:3000/town页面, 
1. 页面背景色去掉渐变色，改为白色

以太坊钱包连接：
点击 "Connect MetaMask" 按钮连接以太坊钱包
连接成功后会自动查询 ETH 余额和 NFT 合约
如果找到 NFT，会显示提示信息
Aptos 钱包连接：
点击 "Connect Petra Wallet" 按钮连接 Aptos 钱包
连接成功后会自动查询 APT 余额和 NFT 资源
如果找到 NFT 资源或事件，会显示提示信息
NFT 查询：
连接钱包后会自动查询 NFT 合约
使用环境变量中的合约地址（VITE_HERO_NFT_ADDRESS 或 VITE_MOVE_HERO_NFT_ADDRESS）
如果找到 NFT，会在 Town 页面的 NFT 区域显示
现在，当用户点击以太坊或 Aptos 连接按钮时，系统应该能够正确连接钱包并查询相应的 NFT 合约。