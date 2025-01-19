# Business system

## 流程描述

a basic business flow in initial arcadia version

1. 玩家玩游戏获得积分，可以在游戏外购买，或者叫兑换 coupon。
2. 玩家有了 coupon 优惠券之后。在个人账户的资产下面会显示已经兑换的这个 coupon。
3. coupon 的基本信息：
   1. 发行商家
   2. 优惠券的名称
   3. 优惠券的描述
   4. 优惠券的类型
   5. 优惠券的折扣
   6. 优惠券的过期时间
4. coupon 本身是有状态的：未使用、已使用、已过期。
5. 用户（玩家）登录自己的账户显示出未使用优惠券。点击显示二维码和这个 pass code。
6. 然后玩家到店铺出示这个商家看，商家可以扫描也可以手工输入这个 Pass code 在他登录的商家管理后台。
7. 这就完成了一次 coupon 的使用。
8. 那对于商家来说，他是的二个重要角色。
9. 商家登陆网站点击商家注册。用 EMAIL 注册账户。
10. 有两个主要功能第 1 个，发行优惠券。发行的时候要选择发行的类别和购买的数量。要初始化 coupon 的基本信息
11. 还有一个是核销优惠券。需要输入 pass code 或者二维码扫描。然后核销这个优惠券。
12. 发行和核销优惠券现在是由中心化的核销服务商提供。未来在去中心化。

## 系统设计

### 商家管理后台

#### 注册和登陆

  首页 Email 注册，（同时获得 account 地址，todo）
  User, Account, MerchantProfile, playerProfile 关系
关于账户和角色的关系：唯一确定用户的是 User 表中的 email 字段（设置了 @unique 约束）Account 表只负责存储第三方登录信息（如 Google、GitHub 的认证信息），不涉及角色 角色是通过 merchantProfile 和 playerProfile 这两个关联表来确定的 同一个用户（同一个 email）可以同时拥有商家和玩家两个角色 用户可以有多个 Account（比如可以用 Google 和 GitHub 登录），但这些 Account 都会关联到同一个 User（通过 email 匹配）

User (唯一标识：email) ├── Account[] (第三方登录信息) │ ├── Google 登录 │ └── GitHub 登录 ├── MerchantProfile (商家角色，可选) └── PlayerProfile (玩家角色，可选)

注册和登陆
首页 Email（唯一）注册，（同时获得 account 地址，todo） 
 检查用户是否登录 检查是否有玩家资料 
 没有资料时重定向到资料注册页面 创建了玩家资料注册功能： 
 创建了资料注册表单 添加了钱包地址验证 实现了资料创建 API 添加了重复钱包地址检查 
 用户流程： 
 用户首次登录时自动创建用户记录 根据选择的角色进入相应页面： 
 商家：检查是否有商家资料，没有则进入商家资料注册 
 玩家：检查是否有玩家资料，没有则进入玩家资料注册（需要提供钱包地址） 
 完成资料注册后进入相应的主页面

用户通过 Google 登录 
2. 如果是新用户，系统会自动创建用户记录 根据用户选择的角色（merchant/player），重定向到相应的初始化页面 如果用户已经有相应的角色配置，则直接进入对应的仪表板

模型设计
检查当前的数据库模型是否完全符合设计要求。
User 模型关系检查：
✅ 正确：
email 字段设置了 @unique 约束作为唯一标识
与 Account 是一对多关系 (accounts Account[])
与 MerchantProfile 是可选的一对一关系 (merchantProfile MerchantProfile?)
与 PlayerProfile 是可选的一对一关系 (playerProfile PlayerProfile?)
Account 模型关系检查：
✅ 正确：
存储第三方登录信息的字段都存在：
provider: 登录提供商（如 Google、GitHub）
providerAccountId: 提供商账户 ID
type: 账户类型
各种 token 相关字段
与 User 的关系正确设置：
userId 外键关联到 User
@@unique([provider, providerAccountId]) 确保每个提供商的账号唯一
onDelete: Cascade 确保用户删除时相关账号也被删除
MerchantProfile 模型关系检查：
✅ 正确：
与 User 是一对一可选关系
userId 设置了 @unique 约束确保一个用户只能有一个商家资料
包含所需的商家特定字段（businessName, description, address 等）
PlayerProfile 模型关系检查：
✅ 正确：
与 User 是一对一可选关系
userId 设置了 @unique 约束确保一个用户只能有一个玩家资料
walletAddress 设置了 @unique 约束确保钱包地址唯一
关系图确认：
User (email: @unique)
├── accounts: Account[] (一对多)
│   ├── Google 登录信息
│   └── GitHub 登录信息
├── merchantProfile: MerchantProfile? (可选一对一)
└── playerProfile: PlayerProfile? (可选一对一)
)
结论：
✅ 数据库模型完全符合设计要求：
User 通过 email 唯一标识
Account 只负责存储第三方登录信息
角色通过独立的 Profile 表实现
支持一个用户同时拥有商家和玩家角色
支持多个第三方账号登录绑定到同一个 User
建议：
考虑在 User 模型添加 isEmailVerified 布尔字段，用于邮箱验证状态管理
考虑在 Profile 模型添加 status 字段，用于管理资料状态（如：待审核、已激活等）
是否需要我帮你实现这些建议的改进？

#### 商家介绍  

  商家名称、商家介绍、商家位置、商家图片集合
  可以修改，至少三张图片
  提供基于地图的位置

#### 积分充值

  目前仅仅支持现金购买线下交易
  线下管理员/运营人员收到现金，提供充值码
  商家输入充值码，完成积分购买

#### 发行优惠券页面

  自动填写优惠券发行商家
  选择优惠券类型
  选择优惠券折扣等信息（依赖不同优惠券类型）
  选择优惠券发行数量
  选择优惠券开始和过期时间
  选择优惠券发行价格（以积分计算）
  提交，检查商家积分余额，支付积分，提交成功
  
#### 已发行优惠券展示页面

  展示已发行优惠券列表
  展示优惠券状态：未使用、已使用、已过期
  展示优惠券使用情况（百分比）
  展示优惠券过期时间
  展示优惠券折扣
  展示优惠券发行商家
  展示优惠券发行数量
  展示优惠券开始和过期时间
  展示优惠券发行价格（以积分计算）

#### 核销优惠券页面

  前提：（优惠券发行后，玩家积分兑换获得优惠券）
  商家获得玩家提供的凭证，页面输入 passcode 或者二维码扫描
  点击核销优惠券
  核销后，优惠券状态变为已使用

### 玩家管理后台
不提供注册登陆，未来和其他系统集成
展示积分余额（虚假功能）
已兑换 Coupon
点击 coupon，显示二维码和 passcode
显示商家介绍：位置、商家名称、商家介绍，图片集合

