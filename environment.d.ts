declare global {
    namespace NodeJS {
      interface ProcessEnv {
        DATABASE_PORT: number;
        ACCESS_TOKEN: string;
        TRANSACTION_TIMEOUT: number;
      }
    }
  }
  
  export {}