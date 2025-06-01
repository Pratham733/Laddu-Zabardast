require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkConnection() {
    const startTime = Date.now();
    console.log('Checking MongoDB connection...');

    try {
        const client = new MongoClient(process.env.MONGODB_URI, {
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000
        });

        await client.connect();
        console.log('✅ Successfully connected to MongoDB');

        const db = client.db(process.env.MONGODB_DB_NAME);
        const stats = await db.command({ serverStatus: 1 });

        console.log('\nConnection Info:');
        console.log('- Database:', process.env.MONGODB_DB_NAME);
        console.log('- MongoDB version:', stats.version);
        console.log('- Uptime:', Math.floor(stats.uptime / 3600), 'hours');
        console.log('- Active connections:', stats.connections.current);
        console.log('- Available connections:', stats.connections.available);

        const collections = await db.listCollections().toArray();
        console.log('\nCollections:', collections.map(c => c.name).join(', '));

        const responseTime = Date.now() - startTime;
        console.log(`\nTotal check time: ${responseTime}ms`);

        await client.close();
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    }
}

checkConnection().catch(console.error);
