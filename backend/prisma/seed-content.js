const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleContent = [
    {
        title: "Understanding Postpartum Depression: Signs and Support",
        body: `Postpartum depression (PPD) affects 1 in 7 new mothers and is more than just "baby blues." It's a serious mental health condition that requires attention and support.

## Common Signs
- Persistent sadness or low mood
- Loss of interest in activities you once enjoyed
- Difficulty bonding with your baby
- Changes in sleep or appetite
- Feelings of worthlessness or guilt

## What You Can Do
1. **Talk to someone**: Reach out to your healthcare provider, a therapist, or a trusted friend
2. **Join a support group**: Connecting with other mothers can help you feel less alone
3. **Prioritize self-care**: Even small moments of rest can make a difference
4. **Ask for help**: Don't hesitate to lean on your support network

Remember, PPD is treatable, and seeking help is a sign of strength, not weakness.`,
        excerpt: "Learn to recognize the signs of postpartum depression and discover resources for support and recovery.",
        category: "Wellness",
        authorName: "Dr. Sarah Johnson",
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-01-15')
    },
    {
        title: "Breastfeeding 101: A Beginner's Guide",
        body: `Starting your breastfeeding journey can feel overwhelming, but with the right information and support, it becomes easier over time.

## Getting Started
- **Positioning**: Find a comfortable position for both you and baby
- **Latch**: Ensure baby has a deep latch to prevent soreness
- **Frequency**: Newborns typically feed 8-12 times per day

## Common Challenges
- Sore nipples
- Low milk supply concerns
- Engorgement
- Mastitis

## Tips for Success
1. Stay hydrated and well-nourished
2. Feed on demand rather than on a schedule
3. Seek help from a lactation consultant if needed
4. Be patient with yourself and your baby

Every breastfeeding journey is unique. What matters most is that your baby is fed and you're both healthy.`,
        excerpt: "Essential tips and guidance for new mothers starting their breastfeeding journey.",
        category: "Breastfeeding",
        authorName: "Lactation Consultant Maria Rodriguez",
        isPremium: false,
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-01-20')
    },
    {
        title: "Sleep Training Methods: Finding What Works for Your Family",
        body: `Sleep training is a personal decision, and there's no one-size-fits-all approach. Here's an overview of popular methods to help you make an informed choice.

## Popular Methods

### Cry It Out (CIO)
Put baby down awake and allow them to self-soothe without intervention.
**Pros**: Often works quickly
**Cons**: Can be emotionally difficult for parents

### Ferber Method
Check on baby at increasing intervals while they learn to self-soothe.
**Pros**: Provides reassurance while teaching independence
**Cons**: Requires consistency and patience

### Chair Method
Gradually move further from baby's crib each night.
**Pros**: Gentle approach with parental presence
**Cons**: Takes longer to see results

### No-Tears Approach
Focus on gentle techniques without letting baby cry.
**Pros**: Emotionally easier for many parents
**Cons**: May take longer to establish sleep patterns

## Important Considerations
- Wait until baby is at least 4-6 months old
- Ensure baby is healthy and well-fed
- Be consistent with your chosen method
- Adjust based on your baby's temperament

Trust your instincts and choose what feels right for your family.`,
        excerpt: "Explore different sleep training methods and find the approach that works best for your family.",
        category: "Parenting",
        authorName: "Sleep Consultant Emma Thompson",
        isPremium: true,
        premiumTier: "premium",
        isFeatured: false,
        status: "approved",
        publishedAt: new Date('2024-02-01')
    },
    {
        title: "Navigating the Teenage Years: Communication Strategies",
        body: `Parenting teenagers comes with unique challenges. Here are strategies to maintain open communication and strengthen your relationship.

## Key Principles

### 1. Listen More Than You Talk
Give your teen space to express themselves without immediately offering solutions or judgment.

### 2. Respect Their Privacy
While staying involved, recognize their need for independence and personal space.

### 3. Pick Your Battles
Not every disagreement needs to become a conflict. Focus on what truly matters.

### 4. Stay Calm
Model the emotional regulation you want to see in your teen.

## Practical Tips
- Schedule regular one-on-one time
- Show interest in their hobbies and friends
- Acknowledge their feelings, even if you disagree
- Set clear boundaries with logical consequences
- Apologize when you make mistakes

## When to Seek Help
If you notice signs of depression, anxiety, substance use, or other concerning behaviors, don't hesitate to reach out to a mental health professional.

Remember, this phase is temporary, and maintaining connection is more important than being perfect.`,
        excerpt: "Effective communication strategies for navigating the challenges of parenting teenagers.",
        category: "Teen Parenting",
        authorName: "Family Therapist Dr. Michael Chen",
        isPremium: true,
        premiumTier: "premium_plus",
        isFeatured: false,
        status: "approved",
        publishedAt: new Date('2024-02-05')
    },
    {
        title: "Meal Prep for Busy Moms: Quick and Nutritious Ideas",
        body: `Finding time to prepare healthy meals can be challenging. These meal prep strategies will help you save time while nourishing your family.

## Weekly Meal Prep Basics
1. **Plan your menu**: Choose 3-4 recipes for the week
2. **Shop smart**: Make one grocery trip with a detailed list
3. **Batch cook**: Prepare multiple meals at once
4. **Store properly**: Use airtight containers for freshness

## Time-Saving Tips
- Chop vegetables in bulk
- Cook grains and proteins in large batches
- Use slow cooker or instant pot
- Prep breakfast items ahead (overnight oats, egg muffins)
- Keep healthy snacks pre-portioned

## Quick Recipe Ideas
- Sheet pan dinners
- One-pot pasta dishes
- Stir-fries with pre-cut vegetables
- Mason jar salads
- Freezer-friendly casseroles

## Involving Kids
Make meal prep a family activity! Even young children can help wash vegetables, stir ingredients, or set the table.

With a little planning, you can reduce stress and ensure your family eats well throughout the week.`,
        excerpt: "Time-saving meal prep strategies and quick recipe ideas for busy families.",
        category: "Wellness",
        authorName: "Nutritionist Lisa Parker",
        isPremium: false,
        isFeatured: false,
        status: "approved",
        publishedAt: new Date('2024-02-10')
    },
    {
        title: "Building Confidence in Your Parenting Decisions",
        body: `Every parent faces moments of doubt. Here's how to trust yourself and make confident decisions for your family.

## Understanding Parenting Doubt
It's normal to question your choices, especially with so much conflicting advice available. This uncertainty often stems from:
- Information overload
- Comparison with other parents
- Fear of making mistakes
- Lack of support

## Building Confidence

### Know Your Values
Identify what matters most to your family. When decisions align with your values, you'll feel more confident.

### Trust Your Instincts
You know your child better than anyone. If something doesn't feel right, it probably isn't.

### Limit Input
Too many opinions can be paralyzing. Choose 2-3 trusted sources for advice.

### Embrace Imperfection
There's no such thing as a perfect parent. Mistakes are opportunities for growth.

### Seek Support
Connect with other parents who share your values and can offer encouragement.

## Practical Steps
1. Make a list of your parenting values
2. Unfollow social media accounts that make you feel inadequate
3. Join a supportive community (like this one!)
4. Practice self-compassion
5. Celebrate your wins, no matter how small

Remember: You are the expert on your child. Trust yourself.`,
        excerpt: "Learn to trust your instincts and make confident parenting decisions that align with your family's values.",
        category: "Parenting",
        authorName: "Parenting Coach Jennifer Adams",
        isPremium: true,
        premiumTier: "premium",
        isFeatured: true,
        status: "approved",
        publishedAt: new Date('2024-02-12')
    }
];

async function main() {
    console.log('🌱 Starting content seed...');

    // Create sample content
    for (const content of sampleContent) {
        const created = await prisma.content.create({
            data: content
        });
        console.log(`✅ Created: ${created.title}`);
    }

    console.log('✨ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
