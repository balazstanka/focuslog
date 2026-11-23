import { Controller, Get } from '@nestjs/common';

@Controller('sessions')
export class SessionsController {
    @Get()
    getActiveSession() {
        return { ok: true }
    }
}
