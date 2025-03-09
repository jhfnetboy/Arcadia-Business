import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start recharging points for all players and merchants...')
  
  // Get all players
  const players = await prisma.playerProfile.findMany({
    include: {
      user: true
    }
  })

  // Get all merchants
  const merchants = await prisma.merchantProfile.findMany({
    include: {
      user: true
    }
  })

  const rechargeAmount = 10000

  // Recharge players
  for (const player of players) {
    await prisma.$transaction([
      // Update player balance
      prisma.playerProfile.update({
        where: { id: player.id },
        data: {
          pointsBalance: {
            increment: rechargeAmount
          }
        }
      }),
      // Create transaction record for player
      prisma.transaction.create({
        data: {
          userId: player.user.id,
          type: "recharge_points",
          amount: rechargeAmount,
          status: "completed",
          quantity: 1,
          merchantId: merchants[0]?.id // Use the first merchant as the source
        }
      })
    ])

    console.log(`Recharged ${rechargeAmount} points for player ${player.user.email}`)
  }

  // Recharge merchants
  for (const merchant of merchants) {
    await prisma.$transaction([
      // Update merchant balance
      prisma.merchantProfile.update({
        where: { id: merchant.id },
        data: {
          pointsBalance: {
            increment: rechargeAmount
          }
        }
      }),
      // Create transaction record for merchant
      prisma.transaction.create({
        data: {
          userId: merchant.user.id,
          type: "recharge_points",
          amount: rechargeAmount,
          status: "completed",
          quantity: 1,
          merchantId: merchant.id // The merchant is recharging their own account
        }
      })
    ])

    console.log(`Recharged ${rechargeAmount} points for merchant ${merchant.user.email}`)
  }
  
  console.log('Points recharged successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 