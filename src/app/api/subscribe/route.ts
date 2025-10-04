import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' }, 
        { status: 400 }
      );
    }

    // Save to database with optional fields
    await prisma.newsletterSubscription.create({
      data: { 
        name, 
        email, 
        subject: subject ?? '', // Use empty string if undefined
        message: message ?? '', // Use empty string if undefined
        status: 'active', 
        source: 'contact-form' 
      },
    });

    return NextResponse.json(
      { message: 'Subscription saved successfully' }, 
      { status: 200 }
    );
    
  } catch (err: any) {
    console.error('Database error:', err);
    
    // Handle unique constraint errors (duplicate email)
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'This email is already subscribed' }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save subscription' }, 
      { status: 500 }
    );
  }
}