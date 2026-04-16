import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.maintenanceRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Hash password once for all demo users
  const password = await bcrypt.hash('password123', 12);

  // ── Users ────────────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: { name: 'Alice Johnson', email: 'alice@example.com', password, role: 'landlord', phone: '+1 (555) 100-0001' },
  });
  const david = await prisma.user.create({
    data: { name: 'David Park', email: 'david@example.com', password, role: 'landlord', phone: '+1 (555) 100-0002' },
  });
  const bob = await prisma.user.create({
    data: { name: 'Bob Smith', email: 'bob@example.com', password, role: 'tenant', phone: '+1 (555) 200-0001' },
  });
  const carol = await prisma.user.create({
    data: { name: 'Carol White', email: 'carol@example.com', password, role: 'tenant', phone: '+1 (555) 200-0002' },
  });
  const eve = await prisma.user.create({
    data: { name: 'Eve Martinez', email: 'eve@example.com', password, role: 'tenant', phone: '+1 (555) 200-0003' },
  });

  console.log('✓ Created 5 users (2 landlords, 3 tenants)');

  // ── Properties ───────────────────────────────────────────────────────────
  const prop1 = await prisma.property.create({
    data: {
      title: 'Sunset Apartments Unit 4B',
      description: 'A modern 2-bedroom apartment with stunning city views and updated kitchen.',
      location: 'Downtown, New York',
      address: '123 Sunset Blvd, Apt 4B, New York, NY 10001',
      rent: 2400,
      bedrooms: 2,
      bathrooms: 1,
      area: 950,
      amenities: ['WiFi', 'Gym', 'Parking', 'Laundry', 'Air Conditioning'],
      status: 'occupied',
      landlordId: alice.id,
      tenantId: bob.id,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      title: 'Riverside Studio Apartment',
      description: 'Cozy studio near the river with great natural light and modern finishes.',
      location: 'Brooklyn, New York',
      address: '456 River Road, Studio 2, Brooklyn, NY 11201',
      rent: 1600,
      bedrooms: 0,
      bathrooms: 1,
      area: 480,
      amenities: ['WiFi', 'Laundry', 'Air Conditioning'],
      status: 'occupied',
      landlordId: alice.id,
      tenantId: carol.id,
    },
  });

  await prisma.property.create({
    data: {
      title: 'Garden Heights 3BR House',
      description: 'Spacious family home with private garden, garage, and newly renovated bathrooms.',
      location: 'Queens, New York',
      address: '789 Garden St, Queens, NY 11354',
      rent: 3200,
      bedrooms: 3,
      bathrooms: 2,
      area: 1500,
      amenities: ['Parking', 'Garden', 'Garage', 'Air Conditioning', 'Storage'],
      status: 'vacant',
      landlordId: alice.id,
    },
  });

  const prop4 = await prisma.property.create({
    data: {
      title: 'Midtown Luxury Loft',
      description: 'High-end loft in the heart of Midtown with exposed brick and rooftop access.',
      location: 'Midtown, New York',
      address: '321 Fifth Ave, Loft 7, New York, NY 10016',
      rent: 4500,
      bedrooms: 1,
      bathrooms: 2,
      area: 1100,
      amenities: ['WiFi', 'Gym', 'Rooftop', 'Concierge', 'Parking', 'Air Conditioning'],
      status: 'occupied',
      landlordId: david.id,
      tenantId: eve.id,
    },
  });

  await prisma.property.create({
    data: {
      title: 'Harlem Walk-Up 2BR',
      description: 'Charming walk-up apartment in vibrant Harlem neighborhood.',
      location: 'Harlem, New York',
      address: '654 Malcolm X Blvd, Apt 3C, New York, NY 10037',
      rent: 1900,
      bedrooms: 2,
      bathrooms: 1,
      area: 800,
      amenities: ['Laundry', 'Air Conditioning'],
      status: 'vacant',
      landlordId: david.id,
    },
  });

  console.log('✓ Created 5 properties');

  // ── Payments ─────────────────────────────────────────────────────────────
  // Bob's payments (prop1 – Alice's landlord)
  await prisma.payment.createMany({
    data: [
      {
        amount: 2400, status: 'paid', date: new Date('2026-01-05'),
        dueDate: new Date('2026-01-01'), propertyId: prop1.id,
        tenantId: bob.id, landlordId: alice.id, month: 'January 2026',
      },
      {
        amount: 2400, status: 'paid', date: new Date('2026-02-03'),
        dueDate: new Date('2026-02-01'), propertyId: prop1.id,
        tenantId: bob.id, landlordId: alice.id, month: 'February 2026',
      },
      {
        amount: 2400, status: 'paid', date: new Date('2026-03-02'),
        dueDate: new Date('2026-03-01'), propertyId: prop1.id,
        tenantId: bob.id, landlordId: alice.id, month: 'March 2026',
      },
      {
        amount: 2400, status: 'pending',
        dueDate: new Date('2026-04-01'), propertyId: prop1.id,
        tenantId: bob.id, landlordId: alice.id, month: 'April 2026',
      },
    ],
  });

  // Carol's payments (prop2 – Alice's landlord)
  await prisma.payment.createMany({
    data: [
      {
        amount: 1600, status: 'paid', date: new Date('2026-01-04'),
        dueDate: new Date('2026-01-01'), propertyId: prop2.id,
        tenantId: carol.id, landlordId: alice.id, month: 'January 2026',
      },
      {
        amount: 1600, status: 'paid', date: new Date('2026-02-06'),
        dueDate: new Date('2026-02-01'), propertyId: prop2.id,
        tenantId: carol.id, landlordId: alice.id, month: 'February 2026',
      },
      {
        amount: 1600, status: 'overdue',
        dueDate: new Date('2026-03-01'), propertyId: prop2.id,
        tenantId: carol.id, landlordId: alice.id, month: 'March 2026',
      },
      {
        amount: 1600, status: 'overdue',
        dueDate: new Date('2026-04-01'), propertyId: prop2.id,
        tenantId: carol.id, landlordId: alice.id, month: 'April 2026',
      },
    ],
  });

  // Eve's payments (prop4 – David's landlord)
  await prisma.payment.createMany({
    data: [
      {
        amount: 4500, status: 'paid', date: new Date('2026-01-02'),
        dueDate: new Date('2026-01-01'), propertyId: prop4.id,
        tenantId: eve.id, landlordId: david.id, month: 'January 2026',
      },
      {
        amount: 4500, status: 'paid', date: new Date('2026-02-01'),
        dueDate: new Date('2026-02-01'), propertyId: prop4.id,
        tenantId: eve.id, landlordId: david.id, month: 'February 2026',
      },
      {
        amount: 4500, status: 'paid', date: new Date('2026-03-03'),
        dueDate: new Date('2026-03-01'), propertyId: prop4.id,
        tenantId: eve.id, landlordId: david.id, month: 'March 2026',
      },
      {
        amount: 4500, status: 'paid', date: new Date('2026-04-01'),
        dueDate: new Date('2026-04-01'), propertyId: prop4.id,
        tenantId: eve.id, landlordId: david.id, month: 'April 2026',
      },
    ],
  });

  console.log('✓ Created 12 payments');

  // ── Maintenance Requests ─────────────────────────────────────────────────
  await prisma.maintenanceRequest.createMany({
    data: [
      {
        title: 'Leaking Faucet in Bathroom',
        issue: 'The bathroom faucet has been dripping continuously for 3 days. It is wasting water and the sound is disturbing at night.',
        status: 'resolved', priority: 'medium',
        tenantId: bob.id, propertyId: prop1.id, landlordId: alice.id,
        notes: 'Replaced washer and faucet cartridge. Fixed on site visit.',
        resolvedAt: new Date('2026-02-15'),
        createdAt: new Date('2026-02-10'),
      },
      {
        title: 'Broken Heater Unit',
        issue: 'The heating unit stopped working completely. Apartment is very cold, especially at night. Need urgent repair.',
        status: 'in_progress', priority: 'urgent',
        tenantId: bob.id, propertyId: prop1.id, landlordId: alice.id,
        notes: 'Technician scheduled for April 16. Parts on order.',
        createdAt: new Date('2026-04-10'),
      },
      {
        title: 'Cracked Window Pane',
        issue: 'The living room window has a crack running across it. Letting in cold air and a safety concern.',
        status: 'pending', priority: 'high',
        tenantId: carol.id, propertyId: prop2.id, landlordId: alice.id,
        createdAt: new Date('2026-04-08'),
      },
      {
        title: 'Mold in Bathroom Ceiling',
        issue: 'Black mold appearing on bathroom ceiling near the vent. Concerned about health effects.',
        status: 'rejected', priority: 'high',
        tenantId: carol.id, propertyId: prop2.id, landlordId: alice.id,
        notes: 'Inspected. What tenant identifies as mold is surface discoloration. Advised tenant to clean with bleach solution.',
        createdAt: new Date('2026-03-20'),
      },
      {
        title: 'Elevator Not Working',
        issue: 'The building elevator has been out of service for 2 days. Very inconvenient for top floor residents.',
        status: 'resolved', priority: 'urgent',
        tenantId: eve.id, propertyId: prop4.id, landlordId: david.id,
        notes: 'Elevator serviced and restored to full operation.',
        resolvedAt: new Date('2026-03-10'),
        createdAt: new Date('2026-03-08'),
      },
      {
        title: 'AC Unit Making Noise',
        issue: 'The air conditioning unit in the bedroom makes a loud rattling noise when running. Cannot sleep.',
        status: 'pending', priority: 'medium',
        tenantId: eve.id, propertyId: prop4.id, landlordId: david.id,
        createdAt: new Date('2026-04-13'),
      },
    ],
  });

  console.log('✓ Created 6 maintenance requests');
  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo accounts (all passwords: password123)');
  console.log('  Landlords: alice@example.com | david@example.com');
  console.log('  Tenants:   bob@example.com | carol@example.com | eve@example.com');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
