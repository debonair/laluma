import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const day7Survey = await prisma.survey.upsert({
    where: { slug: 'day-7-aha' },
    update: {},
    create: {
      slug: 'day-7-aha',
      title: 'How is your first week on Luma?',
      description: 'Help us make Luma better for you and other mothers.',
      triggerDays: 7,
      questions: [
        {
          id: 'q1',
          type: 'rating',
          label: 'Overall, how would you rate your experience so far?',
          required: true
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          label: 'What has been the most helpful feature?',
          options: ['Local Groups', 'Anonymous Support', 'Story Feed', 'Event Discovery'],
          required: true
        },
        {
          id: 'q3',
          type: 'text',
          label: 'Is there anything we could improve to support you better?',
          required: false
        }
      ]
    }
  });

  console.log('Seeded Day-7 Survey:', day7Survey.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
