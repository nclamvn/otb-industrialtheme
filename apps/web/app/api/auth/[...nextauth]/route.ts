// Force Node.js runtime - bcryptjs doesn't work in Edge Runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
