import { PrismaClient } from '@prisma/client'
import * as  Prisma from '@prisma/client'

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
    {
        name: 'James',
        email: 'james@gibsunas.co',
        dishes: {
            create: [
                {
                    name: 'Mushroom Rissoto',
                    published: true,
                    description: 'Savory pasta dish with mushrooms'
                }
            ]
        }
    },
    {
        name: 'Valerie',
        email: 'valerie@gibsunas.co',
        dishes: {
            create: [
                {
                    name: 'Mac & Cheese',
                    published: true,
                    description: 'Kraft duh'
                }
            ]
        }
    }
]

async function main() {
    console.log('Executing db seed');
    for (const data of userData) {
        const user = await prisma.user.create({ data });
        console.log(`Created user:id => ${user.name}:${user.id}`);
    }
    console.log('Db seed executed')
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })
