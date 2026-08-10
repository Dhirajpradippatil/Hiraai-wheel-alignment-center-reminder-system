import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Service from "./models/Service.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "Hirai Wheel Alignment Center",
  });
});


// ===============================
// GET ALL SERVICE RECORDS
// ===============================

app.get("/api/services", async (req, res) => {
  try {

    const services = await Service
      .find()
      .sort({ serviceDate: -1 });

    res.json(services);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});


// ===============================
// ADD NEW SERVICE
// ===============================

app.post("/api/services", async (req, res) => {

  try {

    const service = await Service.create({
      customerName: req.body.customerName,
      phone: req.body.phone,
      carNumber: req.body.carNumber,
      carModel: req.body.carModel,

      // Multiple services
      services: req.body.services,

      currentKm: Number(req.body.currentKm),

      amount: Number(req.body.amount || 0),

      serviceDate: req.body.serviceDate || new Date(),
    });


    res.status(201).json(service);

  } catch (error) {

    console.error(error);

    res.status(400).json({
      message: error.message,
    });

  }

});


// ===============================
// DELETE SERVICE
// ===============================

app.delete("/api/services/:id", async (req, res) => {

  try {

    await Service.findByIdAndDelete(
      req.params.id
    );

    res.json({
      ok: true,
    });

  } catch (error) {

    res.status(400).json({
      message: error.message,
    });

  }

});


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;


mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log("MongoDB connected");

    app.listen(PORT, () => {

      console.log(
        `Server running on http://localhost:${PORT}`
      );

    });

  })

  .catch((error) => {

    console.error(
      "MongoDB connection failed:"
    );

    console.error(error.message);

  });