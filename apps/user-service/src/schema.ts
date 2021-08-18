import {
    intArg,
    makeSchema,
    nonNull,
    objectType,
    stringArg,
    inputObjectType,
    arg,
    asNexusMethod,
    enumType,
} from 'nexus'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from './context'

export const DateTime = asNexusMethod(DateTimeResolver, 'date')

const Query = objectType({
    name: 'Query',
    definition(t) {
        t.nonNull.list.nonNull.field('allUsers', {
            type: 'User',
            resolve: (_parent, _args, context: Context) => {
                return context.prisma.user.findMany()
            },
        })

        t.nullable.field('dishById', {
            type: 'Dish',
            args: {
                id: intArg(),
            },
            resolve: (_parent, args, context: Context) => {
                return context.prisma.dish.findUnique({
                    where: { id: args.id || undefined },
                })
            },
        })

        t.nonNull.list.nonNull.field('feed', {
            type: 'Dish',
            args: {
                searchString: stringArg(),
                skip: intArg(),
                take: intArg(),
                orderBy: arg({
                    type: 'DishOrderByUpdatedAtInput',
                }),
            },
            resolve: (_parent, args, context: Context) => {
                const or = args.searchString
                    ? {
                        OR: [
                            { name: { contains: args.searchString } },
                            { discription: { contains: args.searchString } },
                        ],
                    }
                    : {}

                return context.prisma.dish.findMany({
                    where: {
                        published: true,
                        ...or,
                    },
                    take: args.take || undefined,
                    skip: args.skip || undefined,
                    orderBy: args.orderBy || undefined,
                })
            },
        })

        t.list.field('draftsByUser', {
            type: 'Dish',
            args: {
                userUniqueInput: nonNull(
                    arg({
                        type: 'UserUniqueInput',
                    }),
                ),
            },
            resolve: (_parent, args, context: Context) => {
                return context.prisma.user
                    .findUnique({
                        where: {
                            id: args.userUniqueInput.id || undefined,
                        },
                    })
                    .dishes({
                        where: {
                            published: false,
                        },
                    })
            },
        })
    },
})

const Mutation = objectType({
    name: 'Mutation',
    definition(t) {
        t.nonNull.field('signupUser', {
            type: 'User',
            args: {
                data: nonNull(
                    arg({
                        type: 'UserCreateInput',
                    }),
                ),
            },
            resolve: (_, args, context: Context) => {
                const dishData = args.data.dishes?.map((dish) => {
                    return { name: dish.name, description: dish.description || undefined }
                })
                return context.prisma.user.create({
                    data: {
                        name: args.data.name,
                        email: args.data.email,
                        dishes: {
                            create: dishData,
                        },
                    },
                })
            },
        })

        t.field('createDraft', {
            type: 'Dish',
            args: {
                data: nonNull(
                    arg({
                        type: 'DishCreateInput',
                    }),
                ),
                authorEmail: nonNull(stringArg()),
            },
            resolve: (_, args, context: Context) => {
                return context.prisma.dish.create({
                    data: {
                        name: args.data.name,
                        description: args.data.description,
                        creator: {
                            connect: { email: args.authorEmail },
                        },
                    },
                })
            },
        })

        t.field('togglePublishDish', {
            type: 'Dish',
            args: {
                id: nonNull(intArg()),
            },
            resolve: async (_, args, context: Context) => {
                try {
                    const dish = await context.prisma.dish.findUnique({
                        where: { id: args.id || undefined },
                        select: {
                            published: true,
                        },
                    })
                    return context.prisma.dish.update({
                        where: { id: args.id || undefined },
                        data: { published: !dish?.published },
                    })
                } catch (e) {
                    throw new Error(
                        `Dish with ID ${args.id} does not exist in the database.`,
                    )
                }
            },
        })

        t.field('incrementDishViewCount', {
            type: 'Dish',
            args: {
                id: nonNull(intArg()),
            },
            resolve: (_, args, context: Context) => {
                return context.prisma.dish.update({
                    where: { id: args.id || undefined },
                    data: {
                        viewCount: {
                            increment: 1,
                        },
                    },
                })
            },
        })

        t.field('deleteDish', {
            type: 'Dish',
            args: {
                id: nonNull(intArg()),
            },
            resolve: (_, args, context: Context) => {
                return context.prisma.dish.delete({
                    where: { id: args.id },
                })
            },
        })
    },
})

const User = objectType({
    name: 'User',
    definition(t) {
        t.nonNull.int('id')
        t.string('name')
        t.nonNull.string('email')
        t.nonNull.list.nonNull.field('dishes', {
            type: 'Dish',
            resolve: (parent, _, context: Context) => {
                return context.prisma.user
                    .findUnique({
                        where: { id: parent.id || undefined },
                    })
                    .dishes()
            },
        })
    },
})

const Dish = objectType({
    name: 'Dish',
    definition(t) {
        t.nonNull.int('id')
        t.nonNull.field('createdAt', { type: 'DateTime' })
        t.nonNull.field('updatedAt', { type: 'DateTime' })
        t.nonNull.int('viewCount')
        t.nonNull.string('name')
        t.string('description')
        t.nonNull.boolean('published')
        t.field('creator', {
            type: 'User',
            resolve: (parent, _, context: Context) => {
                return context.prisma.dish
                    .findUnique({
                        where: { id: parent.id || undefined },
                    })
                    .creator()
            },
        })
    },
})

const SortOrder = enumType({
    name: 'SortOrder',
    members: ['asc', 'desc'],
})

const DishOrderByUpdatedAtInput = inputObjectType({
    name: 'DishOrderByUpdatedAtInput',
    definition(t) {
        t.nonNull.field('updatedAt', { type: 'SortOrder' })
    },
})

const UserUniqueInput = inputObjectType({
    name: 'UserUniqueInput',
    definition(t) {
        t.int('id')
        t.string('name')
    },
})

const DishCreateInput = inputObjectType({
    name: 'DishCreateInput',
    definition(t) {
        t.nonNull.string('name')
        t.string('description')
        t.boolean('published')
    },
})

const UserCreateInput = inputObjectType({
    name: 'UserCreateInput',
    definition(t) {
        t.string('name')
        t.nonNull.string('email')
        // it goes here
        t.string('description')
        t.list.nonNull.field('dishes', { type: 'DishCreateInput' })
    },
})

export const schema = makeSchema({
    types: [
        Query,
        Mutation,
        Dish,
        User,
        UserUniqueInput,
        UserCreateInput,
        DishCreateInput,
        SortOrder,
        DishOrderByUpdatedAtInput,
        DateTime,
    ],
    outputs: {
        schema: __dirname + '/../schema.graphql',
        typegen: __dirname + '/generated/nexus.ts',
    },
    contextType: {
        module: require.resolve('./context'),
        export: 'Context',
    },
    sourceTypes: {
        modules: [
            {
                module: '@prisma/client',
                alias: 'prisma',
            },
        ],
    },
})
