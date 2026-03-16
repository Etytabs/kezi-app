const requiredEnvVars = [
    "PORT",
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "DATA_ENCRYPTION_KEY",
    "OPENAI_API_KEY",
  ];
  
  export function validateEnv() {
    const missing: string[] = [];
  
    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    });
  
    if (missing.length > 0) {
      console.error("❌ Missing environment variables:");
      missing.forEach((v) => console.error(`   - ${v}`));
  
      console.error("\n💡 Copy .env.example and configure your environment:");
      console.error("   cp .env.example .env\n");
  
      process.exit(1);
    }
  
    console.log("✅ Environment variables validated");
  }