import NextAuth from "next-auth"
import "next-auth/jwt"

// 增强环境变量检查和日志
const envCheck = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET
};

// 记录环境变量状态（不显示实际值，只显示是否存在）
console.log("环境变量检查:");
for (const [key, value] of Object.entries(envCheck)) {
  console.log(`- ${key}: ${value ? "已设置" : "未设置"}`);
  
  // 对于 NEXTAUTH_URL，检查是否与当前域名匹配
  if (key === "NEXTAUTH_URL" && value) {
    console.log(`  NEXTAUTH_URL 值: ${value}`);
    if (typeof window !== "undefined") {
      console.log(`  当前域名: ${window.location.origin}`);
      console.log(`  是否匹配: ${value.includes(window.location.host)}`);
    }
  }
}

// 添加全局错误处理器
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("全局错误:", event.error);
  });
}

// import Apple from "next-auth/providers/apple"
// import Atlassian from "next-auth/providers/atlassian"
// import Auth0 from "next-auth/providers/auth0"
// import AzureB2C from "next-auth/providers/azure-ad-b2c"
// import BankIDNorway from "next-auth/providers/bankid-no"
// import BoxyHQSAML from "next-auth/providers/boxyhq-saml"
// import Cognito from "next-auth/providers/cognito"
import Coinbase from "next-auth/providers/coinbase"
import Discord from "next-auth/providers/discord"
// import Dropbox from "next-auth/providers/dropbox"
// import Facebook from "next-auth/providers/facebook"
import GitHub from "next-auth/providers/github"
// import GitLab from "next-auth/providers/gitlab"
import Google from "next-auth/providers/google"
// // import Hubspot from "next-auth/providers/hubspot"
// import Keycloak from "next-auth/providers/keycloak"
// import LinkedIn from "next-auth/providers/linkedin"
// import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
// import Netlify from "next-auth/providers/netlify"
// import Okta from "next-auth/providers/okta"
// import Passage from "next-auth/providers/passage"
// import Passkey from "next-auth/providers/passkey"
// import Pinterest from "next-auth/providers/pinterest"
import Reddit from "next-auth/providers/reddit"
import Slack from "next-auth/providers/slack"
// import Salesforce from "next-auth/providers/salesforce"
// import Spotify from "next-auth/providers/spotify"
// import Twitch from "next-auth/providers/twitch"
import Twitter from "next-auth/providers/twitter"
// // import Vipps from "next-auth/providers/vipps"
// import WorkOS from "next-auth/providers/workos"
// import Zoom from "next-auth/providers/zoom"
// 注释掉存储适配器相关代码
// import { createStorage } from "unstorage"
// import memoryDriver from "unstorage/drivers/memory"
// import vercelKVDriver from "unstorage/drivers/vercel-kv"
// import { UnstorageAdapter } from "@auth/unstorage-adapter"

// const storage = createStorage({
//   driver: process.env.VERCEL
//     ? vercelKVDriver({
//         url: process.env.AUTH_KV_REST_API_URL,
//         token: process.env.AUTH_KV_REST_API_TOKEN,
//         env: false,
//       })
//     : memoryDriver(),
// })

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      isNewUser?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    isNewUser?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    isNewUser?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error"
  },
  providers: [
    // Apple,
    // Atlassian,
    // Auth0,
    // AzureB2C,
    // BankIDNorway,
    // BoxyHQSAML({
    //   clientId: "dummy",
    //   clientSecret: "dummy",
    //   issuer: process.env.AUTH_BOXYHQ_SAML_ISSUER,
    // }),
    // Cognito,
    Coinbase,
    Discord,
    // Dropbox,
    // Facebook,
    GitHub,
    // GitLab,
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Hubspot,
    // Keycloak({ name: "Keycloak (bob/bob)" }),
    // LinkedIn,
    // MicrosoftEntraId,
    // Netlify,
    // Okta,
    // Passkey({
    //   formFields: {
    //     email: {
    //       label: "Username",
    //       required: true,
    //       autocomplete: "username webauthn",
    //     },
    //   },
    // }),
    // Passage,
    // Pinterest,
    Reddit,
    // Salesforce,
    Slack,
    // Spotify,
    // Twitch,
    Twitter,
    // Vipps({
    //   issuer: "https://apitest.vipps.no/access-management-1.0/access/",
    // }),
    // WorkOS({ connection: process.env.AUTH_WORKOS_CONNECTION! }),
    // Zoom,
  ],
  basePath: "/api/auth",
  session: { strategy: "jwt" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 添加更详细的日志
      console.log("Redirect callback:", { url, baseUrl });
      console.log("Current URL path:", url);
      console.log("Base URL:", baseUrl);
      
      // 处理预览部署 URL
      const currentHost = typeof window !== "undefined" ? window.location.host : "";
      if (currentHost && !baseUrl.includes(currentHost)) {
        console.log("检测到预览部署，调整 baseUrl:", currentHost);
        baseUrl = `https://${currentHost}`;
      }
      
      // 优化重定向逻辑
      if (url.startsWith("/")) {
        // 如果是相对路径，添加 baseUrl
        return `${baseUrl}${url}`;
      }
      
      // 如果已经是完整的 URL 且以 baseUrl 开头，或者是其他外部 URL
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token }) {
      console.log("Session callback:", { session, token });
      return session;
    },
    async jwt({ token, account }) {
      console.log("JWT callback:", { token, account });
      return token;
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("用户登录:", { 
        userId: user.id, 
        provider: account?.provider,
        isNewUser
      });
    }
  }
})
