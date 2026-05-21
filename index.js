const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const port = process.env.PORT
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

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLI_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload);
        next()
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden' })
    }

}

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
        app.get('/all-appointments/:id', await verifyToken, async (req, res, next) => {
            const id = req.params.id
            // const header = req.headers.authorization
            // console.log(header);

            const query = {
                _id: new ObjectId(id)
            }
            const result = await doctorsColl.findOne(query)
            res.json(result)
        })

        // post appointment 
        app.post('/bookings', await verifyToken, async (req, res) => {
            const data = req.body
            const result = await bookingColl.insertOne(data)
            res.json(result)
        })

        // get a booking by user id
        app.get('/bookings/:id', await verifyToken, async (req, res) => {
            const id = req.params.id
            const query = {
                bookingId: id
            }
            const result = await bookingColl.find(query).toArray()
            res.json(result)
        })

        // update a user appointment
        app.patch('/bookings/:id', await verifyToken, async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = {
                _id: new ObjectId(id)
            }

            console.log(filter);
            const editedUser = req.body
            const doc = {
                $set: {
                    patientEmail: editedUser.patientEmail,
                    patientName: editedUser.patientName,
                    patientPhone: editedUser.patientPhone,
                    aptTime: editedUser.aptTime,
                    aptDate: editedUser.aptDate,
                    reason: editedUser.reason
                }
            }
            console.log(doc);
            const result = await bookingColl.updateOne(
                filter,
                doc
            )
            res.json(result)
        })

        // delete an user 
        app.delete('/bookings/:id', await verifyToken, async (req, res) => {
            const id = req.params.id
            const query = {
                _id: new ObjectId(id)
            }
            const result = await bookingColl.deleteOne(query)
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