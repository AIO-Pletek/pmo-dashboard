#!/bin/bash
# ==============================================
# Reset Admin Password — Run directly on server
# Usage: bash reset-admin.sh <new-password>
# ==============================================

set -e

if [ -z "$1" ]; then
    echo "Usage: bash reset-admin.sh <new-password>"
    echo "Example: bash reset-admin.sh mynewpassword123"
    exit 1
fi

NEW_PASSWORD="$1"

if [ ${#NEW_PASSWORD} -lt 8 ]; then
    echo "Error: Password must be at least 8 characters"
    exit 1
fi

echo "Resetting admin password..."

# Run inside Docker container — directly update SQLite via Node/Bun
docker exec pmo-dashboard bun -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
    const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.log('No admin user found. Creating one...');
        const hash = await bcrypt.hash('$NEW_PASSWORD', 12);
        await db.user.create({
            data: {
                email: 'admin@cbncloud.co.id',
                name: 'Administrator',
                password: hash,
                role: 'ADMIN',
                isActive: true,
            }
        });
        console.log('Admin user created!');
        console.log('Email: admin@cbncloud.co.id');
    } else {
        const hash = await bcrypt.hash('$NEW_PASSWORD', 12);
        await db.user.update({
            where: { id: admin.id },
            data: { password: hash }
        });
        console.log('Password reset successfully!');
        console.log('Email: ' + admin.email);
    }
    console.log('Password: $NEW_PASSWORD');
    await db.\$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
"

echo ""
echo "Done! You can now login with:"
echo "  Email: admin@cbncloud.co.id (atau email admin yang terdaftar)"
echo "  Password: $NEW_PASSWORD"
