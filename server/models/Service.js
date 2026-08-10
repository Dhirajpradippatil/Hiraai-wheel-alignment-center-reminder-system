import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    carNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    carModel: {
      type: String,
      trim: true,
    },

    services: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "Select at least one service",
      },
    },

    currentKm: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    serviceDate: {
      type: Date,
      default: Date.now,
    },

    // Current KM + 5,000
    nextCheckKm: {
      type: Number,
    },

    // Service date + 4 months
    backupReminderDate: {
      type: Date,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


// =====================================
// AUTOMATIC CALCULATIONS
// =====================================

serviceSchema.pre("validate", function (next) {

  const serviceDate = new Date(
    this.serviceDate || Date.now()
  );


  // Next alignment/check after 5,000 KM

  this.nextCheckKm =
    Number(this.currentKm) + 5000;


  // Reminder after 4 months

  const reminderDate =
    new Date(serviceDate);

  reminderDate.setMonth(
    reminderDate.getMonth() + 5
  );


  this.backupReminderDate =
    reminderDate;


  next();
});


export default mongoose.model(
  "Service",
  serviceSchema
);