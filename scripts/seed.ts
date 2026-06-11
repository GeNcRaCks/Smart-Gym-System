const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Clean DB
    try {
        await prisma.exercise.deleteMany();
        await prisma.workoutRecord.deleteMany();
        await prisma.workoutPlan.deleteMany();
        await prisma.equipment.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.report.deleteMany();
        await prisma.memberProfile.deleteMany();
        await prisma.trainerProfile.deleteMany();
        await prisma.adminProfile.deleteMany();
        await prisma.user.deleteMany();
        console.log('Database cleaned');
    } catch (e: any) {
        console.log('Error cleaning database (might be empty):', e.message);
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@smartgym.com',
            name: 'Admin User',
            password: passwordHash,
            role: 'ADMIN',
            adminProfile: {
                create: {
                    accessLevel: 99
                }
            }
        },
    });
    console.log({ adminUser });

    // 2. Create Trainer
    const trainerUser = await prisma.user.create({
        data: {
            email: 'trainer@smartgym.com',
            name: 'John Trainer',
            password: passwordHash,
            role: 'TRAINER',
            trainerProfile: {
                create: {
                    specialty: 'Strength & Conditioning',
                    rating: 4.8,
                    availability: 'Mon-Fri 9am-5pm'
                }
            }
        },
        include: { trainerProfile: true }
    });
    console.log({ trainerUser });

    // 3. Create Member
    const memberUser = await prisma.user.create({
        data: {
            email: 'member@smartgym.com',
            name: 'Jane Member',
            password: passwordHash,
            role: 'MEMBER',
            memberProfile: {
                create: {
                    height: 170,
                    weight: 65,
                    membershipType: 'PREMIUM',
                    level: 'Intermediate'
                }
            }
        },
        include: { memberProfile: true }
    });
    console.log({ memberUser });

    // 4. Create Equipment
    const equipment = await prisma.equipment.createMany({
        data: [
            { name: 'Treadmill 1', type: 'Cardio', status: 'Operational' },
            { name: 'Dumbbell Set', type: 'Strength', status: 'Operational' },
            { name: 'Rowing Machine', type: 'Cardio', status: 'Maintenance' },
        ],
    });
    console.log('Created equipment');

    // 5. Create Workout Plans (by Trainer)
    if (!trainerUser.trainerProfile?.id) {
        throw new Error("Trainer profile creation failed or ID missing");
    }

    const workouts = [
        {
            name: 'PPL - Push Day A',
            description: 'Chest, Shoulders, and Triceps focus. Intensity: High.',
            difficulty: 'Advanced',
            duration: 60,
            exercises: [
                { name: 'Barbell Bench Press', sets: 4, reps: 8, duration: 0 },
                { name: 'Overhead Press', sets: 3, reps: 10, duration: 0 },
                { name: 'Incline Dumbbell Press', sets: 3, reps: 10, duration: 0 },
                { name: 'Tricep Pushdowns', sets: 3, reps: 15, duration: 0 },
                { name: 'Lateral Raises', sets: 4, reps: 15, duration: 0 }
            ]
        },
        {
            name: 'HIIT Cardio Blast',
            description: 'High intensity interval training for maximum fat burn.',
            difficulty: 'Intermediate',
            duration: 30,
            exercises: [
                { name: 'Burpees', sets: 4, reps: 20, duration: 45 },
                { name: 'Mountain Climbers', sets: 4, reps: 0, duration: 60 },
                { name: 'High Knees', sets: 4, reps: 0, duration: 45 },
                { name: 'Jump Squats', sets: 4, reps: 15, duration: 0 }
            ]
        },
        {
            name: 'Yoga for Flexibility',
            description: 'Relaxing flow to improve mobility and reduce stress.',
            difficulty: 'Beginner',
            duration: 45,
            exercises: [
                { name: 'Sun Salutation A', sets: 5, reps: 1, duration: 0 },
                { name: 'Warrior II', sets: 2, reps: 0, duration: 60 },
                { name: 'Tree Pose', sets: 2, reps: 0, duration: 60 },
                { name: 'Child Pose', sets: 1, reps: 0, duration: 120 }
            ]
        },
        {
            name: 'Leg Day Annihilation',
            description: 'Heavy lifting for quads, hamstrings, and glutes.',
            difficulty: 'Advanced',
            duration: 75,
            exercises: [
                { name: 'Barbell Squat', sets: 5, reps: 5, duration: 0 },
                { name: 'Romanian Deadlift', sets: 4, reps: 8, duration: 0 },
                { name: 'Leg Press', sets: 3, reps: 12, duration: 0 },
                { name: 'Lunges', sets: 3, reps: 10, duration: 0 }
            ]
        }
    ];

    for (const plan of workouts) {
        const wp = await prisma.workoutPlan.create({
            data: {
                name: plan.name,
                description: plan.description,
                difficulty: plan.difficulty,
                duration: plan.duration,
                creatorId: trainerUser.trainerProfile.id,
                exercises: {
                    create: plan.exercises
                }
            }
        });
        console.log(`Created plan: ${wp.name}`);
    }

}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e: any) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
