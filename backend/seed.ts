import { getContext } from '@keystone-6/core/context';
import config from './keystone';
import * as PrismaModule from '.prisma/client';

async function seed() {
  console.log('🌱 Seeding database...');

  const context = getContext(config, PrismaModule);

  // Create users with different roles
  const regularUser = await context.query.User.createOne({
    data: {
      username: 'Alice',
      sessionId: 'session-alice-123',
      role: 'USER',
    },
    query: 'id username role',
  });

  const adminUser = await context.query.User.createOne({
    data: {
      username: 'Bob (Admin)',
      sessionId: 'session-bob-456',
      role: 'ADMIN',
    },
    query: 'id username role',
  });

  const superAdminUser = await context.query.User.createOne({
    data: {
      username: 'Charlie (Super Admin)',
      sessionId: 'session-charlie-789',
      role: 'SUPER_ADMIN',
    },
    query: 'id username role',
  });

  console.log(`✅ Created users:
  - ${regularUser.username} (${regularUser.role})
  - ${adminUser.username} (${adminUser.role})
  - ${superAdminUser.username} (${superAdminUser.role})`);

  // Create top-level conversations
  const conversation1 = await context.query.Message.createOne({
    data: {
      content: 'Welcome to Lumion Message Board! This is the first conversation.',
      author: { connect: { id: regularUser.id } },
    },
    query: 'id content',
  });

  const conversation2 = await context.query.Message.createOne({
    data: {
      content: 'What features would you like to see in this message board?',
      author: { connect: { id: adminUser.id } },
    },
    query: 'id content',
  });

  const conversation3 = await context.query.Message.createOne({
    data: {
      content: 'Testing nested threading - how deep should replies go?',
      author: { connect: { id: superAdminUser.id } },
    },
    query: 'id content',
  });

  console.log(`✅ Created ${3} top-level conversations`);

  // Create replies to conversation 1
  const reply1 = await context.query.Message.createOne({
    data: {
      content: 'Great to be here! Looking forward to using this platform.',
      author: { connect: { id: adminUser.id } },
      parentMessage: { connect: { id: conversation1.id } },
    },
    query: 'id content',
  });

  const reply2 = await context.query.Message.createOne({
    data: {
      content: 'I agree! The real-time updates are awesome.',
      author: { connect: { id: superAdminUser.id } },
      parentMessage: { connect: { id: conversation1.id } },
    },
    query: 'id content',
  });

  // Create nested reply (reply to reply)
  await context.query.Message.createOne({
    data: {
      content: 'Indeed! GraphQL subscriptions make it seamless.',
      author: { connect: { id: regularUser.id } },
      parentMessage: { connect: { id: reply2.id } },
    },
    query: 'id content',
  });

  // Create replies to conversation 2
  await context.query.Message.createOne({
    data: {
      content: 'I would love to see markdown support for formatting messages!',
      author: { connect: { id: regularUser.id } },
      parentMessage: { connect: { id: conversation2.id } },
    },
    query: 'id content',
  });

  await context.query.Message.createOne({
    data: {
      content: 'How about file attachments and image uploads?',
      author: { connect: { id: superAdminUser.id } },
      parentMessage: { connect: { id: conversation2.id } },
    },
    query: 'id content',
  });

  // Create replies to conversation 3
  const reply3 = await context.query.Message.createOne({
    data: {
      content: 'I think 2-3 levels deep is sufficient for most use cases.',
      author: { connect: { id: adminUser.id } },
      parentMessage: { connect: { id: conversation3.id } },
    },
    query: 'id content',
  });

  await context.query.Message.createOne({
    data: {
      content: 'Agreed. Too deep and it becomes hard to follow the conversation.',
      author: { connect: { id: regularUser.id } },
      parentMessage: { connect: { id: reply3.id } },
    },
    query: 'id content',
  });

  console.log(`✅ Created 7 replies (including nested replies)`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nYou can now:');
  console.log('  - View messages in the KeystoneJS Admin UI: http://localhost:3000');
  console.log('  - Query via GraphQL Playground: http://localhost:3000/api/graphql');
  console.log('\nSample GraphQL query:');
  console.log(`
  query {
    messages(where: { parentMessage: null }) {
      id
      content
      author {
        username
        role
      }
      replies {
        id
        content
        author {
          username
        }
      }
      createdAt
    }
  }
  `);

  process.exit(0);
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  });
