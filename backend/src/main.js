"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const core_2 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const cookieParser = require("cookie-parser");
const helmet_1 = require("helmet");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Length', 'Date'],
        maxAge: 86400,
    });
    app.use((0, helmet_1.default)());
    app.use(cookieParser());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const reflector = app.get(core_2.Reflector);
    app.useGlobalGuards(new jwt_auth_guard_1.JwtAuthGuard(reflector));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map