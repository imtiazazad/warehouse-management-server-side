const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Running server");
});


app.listen(port, () => {
  console.log(`CROUD server is Running ${port}`);
});


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "application/json");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

// veryfy jwt token
function veryfyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
 
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lmdscg9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const wareHouseCollection = client
      .db("warehouse")
      .collection("warehouseProduct");
    const userCollection = client.db("warehouse").collection("userProduct");



    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });


    app.get("/product", async (req, res) => {
      console.log(req.query);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = wareHouseCollection.find(query);
      let wareHouseProduct;
      if (page || size) {
        wareHouseProduct = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        wareHouseProduct = await cursor.toArray();
      }

      res.send(wareHouseProduct);
    });

    
    app.get("/homeproduct", async (req, res) => {
      const query = {};
      const cursor = wareHouseCollection.find(query);
      const wareHouseProduct = await cursor.limit(6).toArray();
      res.send(wareHouseProduct);
    });


    app.get("/userproduct", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const wareHouseProduct = await cursor.toArray();
      res.send(wareHouseProduct);
    });

    
    app.get("/productcount", async (req, res) => {
      const query = {};
      const cursor = wareHouseCollection.find(query);
      const count = await cursor.count();
      res.send({ count });
    });

 
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await wareHouseCollection.findOne(query);
      res.send(result);
    });

    // get data to database spesific id product (usercollection)
    app.get("/userproduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // get data server spesific  email(usercollection) AND VERYFY JWT TOKEN

    app.get("/userorder", veryfyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = userCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    });

    // add a item to main product collection
    app.post("/product", async (req, res) => {
      const addItem = req.body;
      const result = await wareHouseCollection.insertOne(addItem);
      res.send(result);
    });

    // add a item to usercollection

    app.post("/userproduct", async (req, res) => {
      const addItem = req.body;
      const result = await userCollection.insertOne(addItem);
      res.send(result);
    });

    // update quantity specific  id

    app.put("/product/:id", async (req, res) => {
      id = req.params.id;
      const updateQuantity = req.body;

      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateDocument = {
        $set: {
          quantity: updateQuantity.quantity,
        },
      };

      const result = await wareHouseCollection.updateOne(
        filter,
        updateDocument,
        option
      );
      res.send(result);
    });

    // delete spesific item spesific id product (wareHouseCollection)
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await wareHouseCollection.deleteOne(query);
      res.send(result);
    });

    // delete spesific item spesific id product (usercollection)
    app.delete("/userproduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir());
