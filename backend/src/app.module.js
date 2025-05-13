"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const owners_module_1 = require("./owners/owners.module");
const pets_module_1 = require("./pets/pets.module");
const visits_module_1 = require("./visits/visits.module");
const reminder_module_1 = require("./reminder/reminder.module");
const clinic_profile_module_1 = require("./clinic-profile/clinic-profile.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const clinics_module_1 = require("./admin/clinics/clinics.module");
const users_module_1 = require("./users/users.module");
const users_module_2 = require("./admin/users/users.module");
const clinic_users_module_1 = require("./clinic-users/clinic-users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('THROTTLE_TTL', 60000),
                        limit: configService.get('THROTTLE_LIMIT', 100),
                    },
                ],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            owners_module_1.OwnersModule,
            pets_module_1.PetsModule,
            visits_module_1.VisitsModule,
            reminder_module_1.ReminderModule,
            clinic_profile_module_1.ClinicProfileModule,
            dashboard_module_1.DashboardModule,
            clinics_module_1.ClinicsModule,
            users_module_1.UsersModule,
            users_module_2.UsersModule,
            clinic_users_module_1.ClinicUsersModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map