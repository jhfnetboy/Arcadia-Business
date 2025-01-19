// 优惠券基础类型
export type PromotionBase = {
  name: string
  affect: "price" | "total_order"
  calculate: "multi" | "subtract"
  description: string
}

// 拼团购 - 多人拼单享受折扣
export type GroupBuyingPromotion = PromotionBase & {
  type: "PINDUODUO_GROUP_BUYING"
  num: number // 折扣比例，如 0.7 表示 7 折
  require_people_num: number // 所需人数
}

// 直接优惠 - 直减固定金额
export type DirectReductionPromotion = PromotionBase & {
  type: "PINDUODUO_DIRECT_REDUCTION"
  num: number // 直减金额
}

// 满减优惠 - 满足条件减固定金额
export type FullMinusPromotion = PromotionBase & {
  type: "TAOBAO_FULL_MINUS"
  num: number // 减免金额
  condition: number // 满足金额条件
}

// 店铺优惠券 - 使用积分兑换的代金券
export type StoreCouponPromotion = PromotionBase & {
  type: "TAOBAO_COUPON"
  num: number // 优惠金额
  pay_type: "积分"
  pay_num: number // 所需积分
}

// 折扣优惠 - 按比例折扣
export type PercentageOffPromotion = PromotionBase & {
  type: "AMAZON_PERCENTAGE_OFF"
  num: number // 折扣比例，如 0.85 表示 85 折
}

// 捆绑销售 - 多件商品打包优惠
export type BundleSalePromotion = PromotionBase & {
  type: "AMAZON_BUNDLE_SALE"
  num: number // 折扣比例，如 0.9 表示 9 折
  condition: number // 所需商品数量
}

// 限时特价 - 特定时间段内的折扣
export type DailyDealPromotion = PromotionBase & {
  type: "EBAY_DAILY_DEAL"
  num: number // 折扣比例，如 0.6 表示 6 折
  time_limit: true
}

// 优惠码 - 使用特定代码享受优惠
export type CouponCodePromotion = PromotionBase & {
  type: "EBAY_COUPON_CODE"
  num: number // 优惠金额
  pay_type: "积分"
}

// 所有优惠类型的联合类型
export type PromotionType =
  | GroupBuyingPromotion
  | DirectReductionPromotion
  | FullMinusPromotion
  | StoreCouponPromotion
  | PercentageOffPromotion
  | BundleSalePromotion
  | DailyDealPromotion
  | CouponCodePromotion

// 优惠计算函数
export function calculateDiscount(
  promotion: PromotionType,
  price: number,
  options?: {
    totalOrder?: number
    peopleCount?: number
    itemCount?: number
    currentTime?: Date
  }
): number {
  switch (promotion.type) {
    case "PINDUODUO_GROUP_BUYING":
      if (!options?.peopleCount || options.peopleCount < promotion.require_people_num) {
        return price // 人数不足，无法享受优惠
      }
      return price * promotion.num

    case "PINDUODUO_DIRECT_REDUCTION":
      return price - promotion.num

    case "TAOBAO_FULL_MINUS":
      if (!options?.totalOrder || options.totalOrder < promotion.condition) {
        return price // 未满足条件，无法享受优惠
      }
      return price - promotion.num

    case "TAOBAO_COUPON":
      return price - promotion.num

    case "AMAZON_PERCENTAGE_OFF":
      return price * promotion.num

    case "AMAZON_BUNDLE_SALE":
      if (!options?.itemCount || options.itemCount < promotion.condition) {
        return price // 商品数量不足，无法享受优惠
      }
      return price * promotion.num

    case "EBAY_DAILY_DEAL":
      if (!options?.currentTime) {
        return price // 无法验证时间，不能享受优惠
      }
      return price * promotion.num

    case "EBAY_COUPON_CODE":
      return price - promotion.num

    default:
      return price
  }
}

// 优惠券使用示例
export const promotionExamples = {
  // 拼团购示例：3 人成团享受 7 折
  groupBuying: {
    type: "PINDUODUO_GROUP_BUYING",
    name: "拼团购",
    affect: "price",
    calculate: "multi",
    num: 0.7,
    require_people_num: 3,
    description: "3 人成团享 7 折优惠"
  } as GroupBuyingPromotion,

  // 直接优惠示例：直减 20 元
  directReduction: {
    type: "PINDUODUO_DIRECT_REDUCTION",
    name: "直接优惠",
    affect: "price",
    calculate: "subtract",
    num: 20,
    description: "立减 20 元"
  } as DirectReductionPromotion,

  // 满减示例：满 200 减 50
  fullMinus: {
    type: "TAOBAO_FULL_MINUS",
    name: "满减优惠",
    affect: "total_order",
    calculate: "subtract",
    num: 50,
    condition: 200,
    description: "满 200 元减 50 元"
  } as FullMinusPromotion,

  // 店铺优惠券示例：100 积分兑换 10 元优惠券
  storeCoupon: {
    type: "TAOBAO_COUPON",
    name: "店铺优惠券",
    affect: "price",
    calculate: "subtract",
    num: 10,
    pay_type: "积分",
    pay_num: 100,
    description: "100 积分兑换 10 元优惠券"
  } as StoreCouponPromotion,

  // 折扣示例：85 折优惠
  percentageOff: {
    type: "AMAZON_PERCENTAGE_OFF",
    name: "折扣优惠",
    affect: "price",
    calculate: "multi",
    num: 0.85,
    description: "全场 85 折"
  } as PercentageOffPromotion,

  // 捆绑销售示例：买 2 件 9 折
  bundleSale: {
    type: "AMAZON_BUNDLE_SALE",
    name: "捆绑销售",
    affect: "total_order",
    calculate: "multi",
    num: 0.9,
    condition: 2,
    description: "买 2 件享 9 折"
  } as BundleSalePromotion,

  // 限时特价示例：限时 6 折
  dailyDeal: {
    type: "EBAY_DAILY_DEAL",
    name: "限时特价",
    affect: "price",
    calculate: "multi",
    num: 0.6,
    time_limit: true,
    description: "限时 6 折特惠"
  } as DailyDealPromotion,

  // 优惠码示例：减 15 元
  couponCode: {
    type: "EBAY_COUPON_CODE",
    name: "优惠码",
    affect: "total_order",
    calculate: "subtract",
    num: 15,
    pay_type: "积分",
    description: "使用优惠码减 15 元"
  } as CouponCodePromotion
}

// 使用示例
/*
// 计算拼团购优惠
const price = 100
const groupBuyingDiscount = calculateDiscount(promotionExamples.groupBuying, price, {
  peopleCount: 3
})
console.log(`原价：${price}，拼团后：${groupBuyingDiscount}`) // 输出：原价：100，拼团后：70

// 计算满减优惠
const totalOrder = 250
const fullMinusDiscount = calculateDiscount(promotionExamples.fullMinus, price, {
  totalOrder
})
console.log(`订单总额：${totalOrder}，优惠后：${fullMinusDiscount}`) // 输出：订单总额：250，优惠后：50

// 计算捆绑销售优惠
const bundleSaleDiscount = calculateDiscount(promotionExamples.bundleSale, price, {
  itemCount: 2
})
console.log(`原价：${price}，买 2 件后：${bundleSaleDiscount}`) // 输出：原价：100，买 2 件后：90
*/  EBAY_COUPON_CODE = {  
        "name": "优惠码",  
        "affect": "total_order",   
        "calculate": "subtract",  
        "num": 15,  # 减 15 元  
        "pay_type": "积分",  # 支付类型
        "pay_num": 0,  # 支付积分数量，发布时设置更改，优惠码默认是优惠券已经支付过积分，因此默认 0
        "description": "使用特定优惠码享受优惠"  
    }
# 使用示例  
promo = PromotionType.PINDUODUO_GROUP_BUYING  
print(f"促销类型：{promo.name}")  
print(f"折扣力度：{promo.value['num'] * 100}%")


创建了一个完整的优惠券类型系统，包括数据模型和计算方法。让我为你详细解释每种优惠券类型：
拼团购 (PINDUODUO_GROUP_BUYING)
特点：需要达到指定人数才能享受折扣
参数：
num: 折扣比例（如 0.7 表示 7 折）
require_people_num: 所需人数
计算方式：price * num（达到人数要求时）
直接优惠 (PINDUODUO_DIRECT_REDUCTION)
特点：直接减去固定金额
参数：
num: 减免金额
计算方式：price - num
3. 满减优惠 (TAOBAO_FULL_MINUS)
特点：订单满足特定金额时减免固定金额
参数：
num: 减免金额
condition: 满足金额条件
计算方式：price - num（满足条件时）
店铺优惠券 (TAOBAO_COUPON)
特点：使用积分兑换的代金券
参数：
num: 优惠金额
pay_num: 兑换所需积分
计算方式：price - num
折扣优惠 (AMAZON_PERCENTAGE_OFF)
特点：按比例折扣
参数：
num: 折扣比例（如 0.85 表示 85 折）
计算方式：price * num
捆绑销售 (AMAZON_BUNDLE_SALE)
特点：购买多件商品时享受折扣
参数：
num: 折扣比例
condition: 所需商品数量
计算方式：price * num（达到数量要求时）
限时特价 (EBAY_DAILY_DEAL)
特点：特定时间段内的折扣
参数：
num: 折扣比例
time_limit: 时间限制标志
计算方式：price * num（在有效时间内）
优惠码 (EBAY_COUPON_CODE)
特点：使用特定代码享受优惠
参数：
num: 优惠金额
计算方式：price - num
每种优惠券都包含基础属性：
name: 优惠券名称
affect: 影响范围（单品价格或订单总额）
calculate: 计算方式（乘法折扣或减法优惠）
description: 优惠描述
使用方法：
// 订单总额：250，优惠后：50
订单总额：250，优惠后：50
这个系统的优点是：
类型安全：使用 TypeScript 类型系统确保数据正确性
可扩展：易于添加新的优惠类型
统一接口：所有优惠券使用相同的计算接口
灵活配置：每种优惠类型都可以自定义参数

```
import { calculateDiscount, promotionExamples } from '@/lib/promotion-types'

// 计算拼团购优惠
const price = 100
const discount = calculateDiscount(promotionExamples.groupBuying, price, {
  peopleCount: 3
})
// 原价：100，优惠后：70

// 计算满减优惠
const totalOrder = 250
const discount2 = calculateDiscount(promotionExamples.fullMinus, price, {
  totalOrder
})
// 订单总额：250，优惠后：50
```


这个枚举不仅定义了促销类型，还包含了详细的促销信息和计算方式

 促销策略特点分析
1. 拼多多（Pinduoduo）
最具特色的是拼团购模式
强调社交电商和团购优惠
价格更低但需要多人参与
1. 淘宝（Taobao）
以满减和优惠券为主
灵活的优惠组合策略
注重用户黏性和复购
1. 亚马逊（Amazon）
强调直接的折扣和捆绑销售
更加标准化的促销模式
注重商品组合销售
1. eBay
限时特价和优惠码为主
国际化的促销策略
更多面向全球用户

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

从优惠券类型的设置中提取折扣类型和值：
如果计算方式是 "multi"（乘法），表示是百分比折扣
如果计算方式是 "subtract"（减法），表示是固定金额折扣
对于百分比折扣，我们将折扣率转换为折扣百分比：
例如，0.7（7 折）转换为 30（30% off）
对于固定金额折扣，直接使用设置中的数值。
这样应该可以解决 discountType 和 discountValue 字段缺失的问题。请尝试再次创建优惠券。



### 玩家管理后台
不提供注册登陆，未来和其他系统集成
展示积分余额（虚假功能）
已兑换 Coupon
点击 coupon，显示二维码和 passcode
显示商家介绍：位置、商家名称、商家介绍，图片集合

