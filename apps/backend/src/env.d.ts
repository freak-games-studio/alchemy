declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_IP: string
      APP_PORT: number
    }
  }
}

export {}
