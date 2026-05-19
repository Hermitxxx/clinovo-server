const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const port = 5000
dotenv.config()

const uri = process.env.MONGO_URI

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('clinovo')
        const doctorsColl = db.collection('doctors')
        const bookingColl = db.collection('bookings')

        // get all doctors
        app.get('/doctors', async (req, res) => {
            const cursor = doctorsColl.find()
            const result = await cursor.toArray()
            res.json(result)
        })

        // get top doctors
        app.get('/top-doctors', async (req, res) => {
            const query = {
                rating: -1
            }
            const result = await doctorsColl.find().sort(query).limit(3).toArray()
            res.json(result)
        })

        // get single appointment by id
        app.get('/all-appointments/:id', async (req, res) => {
            const id = req.params.id
            const query = {
                _id: new ObjectId(id)
            }
            const result = await doctorsColl.findOne(query)
            res.json(result)
        })

        // post appointment 
        app.post('/bookings', async (req, res) => {
            const data = req.body
            const result = await bookingColl.insertOne(data)
            res.json(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log('server running on port', port);
})