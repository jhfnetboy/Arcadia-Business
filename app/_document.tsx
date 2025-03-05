   // app/_document.tsx
   import Document, { Html, Head, Main, NextScript } from 'next/document';

   class MyDocument extends Document {
     render() {
       return (
         <Html>
           <Head>
             <title>Page Not Found</title>
           </Head>
           <body>
             <Main />
             <NextScript />
           </body>
         </Html>
       );
     }
   }

   export default MyDocument;