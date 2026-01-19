import { getContext } from '@keystone-6/core/context';
import config from './keystone';
import * as PrismaModule from '.prisma/client';

// Random data generators
const conversationTopics = [
  'What do you think about TypeScript vs JavaScript?',
  'Best practices for React state management',
  'How do you handle authentication in your apps?',
  'Favorite VS Code extensions?',
  'Docker vs Kubernetes for small projects',
  'GraphQL vs REST - which do you prefer?',
  'Tips for improving code review processes',
  'How to stay motivated while coding',
  'Best resources for learning system design',
  'Thoughts on the new React Server Components?',
  'How do you organize your project structure?',
  'Favorite testing frameworks and why',
  'Tips for debugging production issues',
  'How to handle technical debt',
  'Best practices for API versioning',
  'Microservices vs monolith architecture',
  'How do you document your code?',
  'Favorite programming books',
  'How to mentor junior developers',
  'Tips for remote team collaboration',
  'What IDE/editor do you use?',
  'How do you handle database migrations?',
  'Thoughts on AI-assisted coding?',
  'Best practices for error handling',
  'How to design scalable systems',
  'Tips for writing clean code',
  'Favorite open source projects',
  'How do you handle secrets management?',
  'Best CI/CD practices',
  'How to optimize frontend performance',
  'Thoughts on serverless architecture',
  'How do you approach refactoring?',
  'Best practices for logging',
  'How to handle rate limiting',
  'Tips for API security',
];

const replyTemplates = [
  'Great point! I totally agree with this.',
  'Interesting perspective. Have you considered...?',
  'I had a similar experience with this.',
  'Thanks for sharing! This is really helpful.',
  'I disagree actually. In my experience...',
  'Could you elaborate more on this?',
  'This matches what I have seen in production.',
  'Good question! Here is my take on it.',
  'I have been thinking about this too.',
  'Nice insight! Adding to this...',
  'This is exactly what I needed to hear.',
  'Solid advice. I will try this approach.',
  'I have a different opinion on this matter.',
  'Thanks! This solved my problem.',
  'Can you share some examples?',
];

const userNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank',
  'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('🌱 Seeding database...');

  const context = getContext(config, PrismaModule);

  // Create users with different roles
  const users: Array<{ id: string; username: string; role: string }> = [];

  for (let i = 0; i < userNames.length; i++) {
    const role = i === 0 ? 'SUPER_ADMIN' : i <= 2 ? 'ADMIN' : 'USER';
    const user = await context.query.User.createOne({
      data: {
        username: userNames[i],
        sessionId: `session-${userNames[i].toLowerCase()}-${Date.now()}-${i}`,
        role,
      },
      query: 'id username role',
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);

  // Create 35 top-level conversations (more than PAGE_SIZE of 20)
  const conversations: Array<{ id: string; content: string }> = [];

  for (let i = 0; i < 35; i++) {
    const conversation = await context.query.Message.createOne({
      data: {
        content: conversationTopics[i % conversationTopics.length],
        author: { connect: { id: randomElement(users).id } },
      },
      query: 'id content',
    });
    conversations.push(conversation);

    // Add a small delay to ensure different createdAt timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log(`✅ Created ${conversations.length} top-level conversations`);

  // Create replies for each conversation
  let totalReplies = 0;

  for (const conversation of conversations) {
    const replyCount = randomInt(0, 5);

    for (let i = 0; i < replyCount; i++) {
      await context.query.Message.createOne({
        data: {
          content: randomElement(replyTemplates),
          author: { connect: { id: randomElement(users).id } },
          parentMessage: { connect: { id: conversation.id } },
        },
        query: 'id content',
      });
      totalReplies++;
    }
  }

  console.log(`✅ Created ${totalReplies} replies`);

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
