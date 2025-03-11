#!/usr/bin/env node
import { MongoClient } from 'mongodb';

const MONGO_URL = 'mongodb://root:example@localhost:27017/test?authSource=admin';

async function seed() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    
    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.collection('users').drop().catch(() => console.log('No users collection to drop'));
    await db.collection('products').drop().catch(() => console.log('No products collection to drop'));
    await db.collection('orders').drop().catch(() => console.log('No orders collection to drop'));
    
    // Create users collection
    console.log('Creating users collection...');
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        age: 32,
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94103',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        interests: ['technology', 'photography', 'travel'],
        memberSince: new Date('2020-01-15'),
        active: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 28,
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        interests: ['art', 'music', 'cooking'],
        memberSince: new Date('2021-03-10'),
        active: true
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        age: 45,
        address: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          coordinates: { lat: 41.8781, lng: -87.6298 }
        },
        interests: ['sports', 'movies', 'gardening'],
        memberSince: new Date('2019-07-22'),
        active: false
      }
    ];
    const userResult = await db.collection('users').insertMany(users);
    console.log(`Inserted ${users.length} users`);
    
    // Create products collection
    console.log('Creating products collection...');
    const products = [
      {
        name: 'Smartphone X',
        sku: 'PHONE-X-123',
        category: 'electronics',
        price: 999.99,
        specifications: {
          brand: 'TechCo',
          model: 'X',
          ram: '8GB',
          storage: '256GB',
          screenSize: '6.5"'
        },
        inStock: true,
        quantity: 50,
        tags: ['smartphone', 'high-end', 'camera'],
        rating: 4.8,
        lastUpdated: new Date()
      },
      {
        name: 'Coffee Maker Deluxe',
        sku: 'HOME-CM-456',
        category: 'appliances',
        price: 129.99,
        specifications: {
          brand: 'HomeGoods',
          model: 'Deluxe',
          capacity: '12 cups',
          color: 'black',
          programs: ['regular', 'strong', 'iced']
        },
        inStock: true,
        quantity: 25,
        tags: ['coffee', 'kitchen', 'morning'],
        rating: 4.2,
        lastUpdated: new Date()
      },
      {
        name: 'Designer Desk Lamp',
        sku: 'HOME-DL-789',
        category: 'home decor',
        price: 79.99,
        specifications: {
          brand: 'LightWorks',
          model: 'Modern',
          material: 'brushed aluminum',
          height: '18 inches',
          bulbType: 'LED'
        },
        inStock: false,
        quantity: 0,
        tags: ['lamp', 'office', 'lighting'],
        rating: 4.5,
        lastUpdated: new Date()
      }
    ];
    const productResult = await db.collection('products').insertMany(products);
    console.log(`Inserted ${products.length} products`);
    
    // Create orders collection
    console.log('Creating orders collection...');
    const orders = [
      {
        orderNumber: 'ORD-12345',
        userId: userResult.insertedIds[0],
        userEmail: users[0].email,
        date: new Date('2023-05-15'),
        items: [
          { productId: productResult.insertedIds[0], name: products[0].name, quantity: 1, price: products[0].price }
        ],
        total: products[0].price,
        shipping: {
          address: users[0].address,
          method: 'express',
          trackingNumber: 'TRK123456789'
        },
        payment: {
          method: 'credit_card',
          status: 'completed'
        },
        status: 'delivered'
      },
      {
        orderNumber: 'ORD-67890',
        userId: userResult.insertedIds[1],
        userEmail: users[1].email,
        date: new Date('2023-06-20'),
        items: [
          { productId: productResult.insertedIds[1], name: products[1].name, quantity: 1, price: products[1].price },
          { productId: productResult.insertedIds[2], name: products[2].name, quantity: 2, price: products[2].price }
        ],
        total: products[1].price + (products[2].price * 2),
        shipping: {
          address: users[1].address,
          method: 'standard',
          trackingNumber: 'TRK987654321'
        },
        payment: {
          method: 'paypal',
          status: 'completed'
        },
        status: 'shipped'
      },
      {
        orderNumber: 'ORD-24680',
        userId: userResult.insertedIds[2],
        userEmail: users[2].email,
        date: new Date('2023-07-05'),
        items: [
          { productId: productResult.insertedIds[0], name: products[0].name, quantity: 1, price: products[0].price }
        ],
        total: products[0].price,
        shipping: {
          address: users[2].address,
          method: 'standard',
          trackingNumber: null
        },
        payment: {
          method: 'credit_card',
          status: 'pending'
        },
        status: 'processing'
      }
    ];
    await db.collection('orders').insertMany(orders);
    console.log(`Inserted ${orders.length} orders`);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

seed().catch(console.error); 