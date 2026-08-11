import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createRoot } from "react-dom/client";

import "./styles.css";

const API =
  "https://hiraai-wheel-alignment-center-reminder.onrender.com/api";

const CENTER_NAME =
  "Hiraai Wheel Alignment Center";

const CENTER_PHONE = "8605132782";

const SERVICE_OPTIONS = [
  "Wheel Alignment",
  "Wheel Balancing",
  "Tyre Change",
  "Nitrogen",
  "Disc Repair",
  "Puncture Repair",
  "Tyre Rotation",
  "Other",
];

// =====================================
// DATE FORMAT
// =====================================

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// =====================================
// LOCAL DATE STRING
// =====================================

function getLocalDateString(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================
// CURRENT MONTH
// =====================================

function getCurrentMonthString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

// =====================================
// GET SERVICES
// =====================================

function getServices(record) {
  if (
    Array.isArray(record.services) &&
    record.services.length > 0
  ) {
    return record.services;
  }

  // Support old records
  if (record.serviceType) {
    return [record.serviceType];
  }

  return [];
}

// =====================================
// REMINDER STATUS
// =====================================

function getReminderStatus(reminderDate) {
  if (!reminderDate) {
    return {
      text: "No reminder",
      className: "",
    };
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const reminder = new Date(
    reminderDate
  );

  reminder.setHours(0, 0, 0, 0);

  const difference =
    reminder.getTime() -
    today.getTime();

  const days = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return {
      text: "Reminder overdue",
      className: "overdue",
    };
  }

  if (days === 0) {
    return {
      text: "Reminder today",
      className: "due",
    };
  }

  if (days <= 30) {
    return {
      text: `Due in ${days} days`,
      className: "soon",
    };
  }

  return {
    text: `Due in ${days} days`,
    className: "",
  };
}

// =====================================
// IS REMINDER DUE SOON
// =====================================

function isReminderDueSoon(record) {
  if (!record.backupReminderDate) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const reminder = new Date(
    record.backupReminderDate
  );

  reminder.setHours(0, 0, 0, 0);

  const difference =
    reminder.getTime() -
    today.getTime();

  const days = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );

  // Show overdue + next 30 days
  return days <= 30;
}

// =====================================
// WHATSAPP MESSAGE
// =====================================

function createWhatsAppMessage(record) {
  const currentKm = Number(
    record.currentKm || 0
  ).toLocaleString("en-IN");

  const nextKm = Number(
    record.nextCheckKm || 0
  ).toLocaleString("en-IN");

  const reminderDate = formatDate(
    record.backupReminderDate
  );

  return `Hello ${record.customerName},

HIRAAI WHEEL ALIGNMENT CENTER

Your vehicle ${record.carNumber} was recently serviced at our center.

Service Details
Service Date: ${formatDate(record.serviceDate)}
Current KM: ${currentKm} KM
Next Alignment/Check: ${nextKm} KM
Reminder Date: ${reminderDate}

If your vehicle has reached or crossed ${nextKm} KM, we recommend getting the wheel alignment checked to maintain proper tyre life, vehicle stability, and a smooth driving experience.

For appointments or assistance:
Contact: ${CENTER_PHONE}

Thank you for choosing Hiraai Wheel Alignment Center.

Drive Safe!`;
}

// =====================================
// SEND WHATSAPP
// =====================================

function sendWhatsApp(phone, record) {
  let mobile = String(phone).replace(
    /\D/g,
    ""
  );

  // Indian 10-digit number
  if (mobile.length === 10) {
    mobile = "91" + mobile;
  }

  const message =
    createWhatsAppMessage(record);

  const url =
    `https://wa.me/${mobile}?text=${encodeURIComponent(
      message
    )}`;

  window.open(url, "_blank");
}

// =====================================
// CARD
// =====================================

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="card-title">
        {title}
      </div>

      <div className="card-value">
        {value}
      </div>
    </div>
  );
}

// =====================================
// APP
// =====================================

function App() {
  const [records, setRecords] =
    useState([]);

  const [page, setPage] =
    useState("dashboard");

  const [search, setSearch] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(
      getLocalDateString(new Date())
    );

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    carNumber: "",
    carModel: "",
    currentKm: "",
    amount: "",

    serviceDate:
      getLocalDateString(new Date()),

    services: [
      "Wheel Alignment",
    ],
  });

  // =====================================
  // LOAD RECORDS
  // =====================================

  async function loadRecords() {
    try {
      const response = await fetch(
        `${API}/services`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load records"
        );
      }

      const data =
        await response.json();

      setRecords(data);
    } catch (error) {
      console.error(error);

      alert(
        "Backend is not connected."
      );
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  // =====================================
  // LATEST RECORD PER CAR
  // =====================================

  const latestRecords = useMemo(() => {
    const carMap = new Map();

    records.forEach((record) => {
      const oldRecord =
        carMap.get(record.carNumber);

      if (
        !oldRecord ||
        new Date(record.serviceDate) >
          new Date(oldRecord.serviceDate)
      ) {
        carMap.set(
          record.carNumber,
          record
        );
      }
    });

    return Array.from(
      carMap.values()
    );
  }, [records]);

  // =====================================
  // CUSTOMER COUNT
  // =====================================

  const customerCount =
    new Set(
      records.map(
        (record) => record.phone
      )
    ).size;

  // =====================================
  // TODAY DATE
  // =====================================

  const todayDate =
    getLocalDateString(new Date());

  // =====================================
  // TODAY RECORDS
  // =====================================

  const todayRecords =
    records.filter((record) => {
      return (
        getLocalDateString(
          record.serviceDate
        ) === todayDate
      );
    });

  // =====================================
  // TODAY COUNT
  // =====================================

  const todayCount =
    todayRecords.length;

  // =====================================
  // TODAY REVENUE
  // =====================================

  const todayRevenue =
    todayRecords.reduce(
      (total, record) => {
        return (
          total +
          Number(record.amount || 0)
        );
      },
      0
    );

  // =====================================
  // CURRENT MONTH
  // =====================================

  const currentMonth =
    getCurrentMonthString();

  // =====================================
  // CURRENT MONTH RECORDS
  // =====================================

  const monthlyRecords =
    records.filter((record) => {
      const serviceDate =
        getLocalDateString(
          record.serviceDate
        );

      return serviceDate.startsWith(
        currentMonth
      );
    });

  // =====================================
  // MONTHLY SALES
  // =====================================

  const monthlySales =
    monthlyRecords.reduce(
      (total, record) => {
        return (
          total +
          Number(record.amount || 0)
        );
      },
      0
    );

  // =====================================
  // DATE-WISE RECORDS
  // =====================================

  const selectedDateRecords =
    records.filter((record) => {
      return (
        getLocalDateString(
          record.serviceDate
        ) === selectedDate
      );
    });

  // =====================================
  // DATE-WISE SALES
  // =====================================

  const selectedDateSales =
    selectedDateRecords.reduce(
      (total, record) => {
        return (
          total +
          Number(record.amount || 0)
        );
      },
      0
    );

  // =====================================
  // REMINDER CUSTOMERS
  // =====================================

  const reminderRecords =
    latestRecords.filter(
      isReminderDueSoon
    );

  // =====================================
  // TOGGLE SERVICE
  // =====================================

  function toggleService(service) {
    setForm((oldForm) => {
      const alreadySelected =
        oldForm.services.includes(
          service
        );

      let newServices;

      if (alreadySelected) {
        newServices =
          oldForm.services.filter(
            (item) => item !== service
          );
      } else {
        newServices = [
          ...oldForm.services,
          service,
        ];
      }

      // At least one service
      if (newServices.length === 0) {
        newServices = [
          "Wheel Alignment",
        ];
      }

      return {
        ...oldForm,
        services: newServices,
      };
    });
  }

  // =====================================
  // SAVE SERVICE
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.services.length === 0) {
      alert(
        "Please select at least one service."
      );

      return;
    }

    if (!form.currentKm) {
      alert(
        "Please enter current KM."
      );

      return;
    }

    const payload = {
      customerName:
        form.customerName.trim(),

      phone: form.phone.trim(),

      carNumber: form.carNumber
        .trim()
        .toUpperCase(),

      carModel:
        form.carModel.trim(),

      currentKm: Number(
        form.currentKm
      ),

      amount: Number(
        form.amount || 0
      ),

      services: form.services,

      serviceDate:
        form.serviceDate,
    };

    try {
      const response =
        await fetch(
          `${API}/services`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to save service."
        );

        return;
      }

      alert(
        `Service saved successfully!\n\n` +
          `Next alignment/check: ` +
          `${Number(
            data.nextCheckKm || 0
          ).toLocaleString(
            "en-IN"
          )} KM\n\n` +
          `Reminder date: ` +
          `${formatDate(
            data.backupReminderDate
          )}`
      );

      setForm({
        customerName: "",
        phone: "",
        carNumber: "",
        carModel: "",
        currentKm: "",
        amount: "",

        serviceDate:
          getLocalDateString(
            new Date()
          ),

        services: [
          "Wheel Alignment",
        ],
      });

      await loadRecords();

      setPage("customers");
    } catch (error) {
      console.error(error);

      alert(
        "Cannot connect to backend."
      );
    }
  }

  // =====================================
  // SEARCH
  // =====================================

  const filteredRecords =
    latestRecords.filter(
      (record) => {
        const text = `
          ${record.customerName}
          ${record.phone}
          ${record.carNumber}
          ${record.carModel}
        `.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      }
    );

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="shop-photo-container">
        </div>

        <div className="brand">

          <div className="brand-logo">
            H
          </div>

          <div>
            <h1>
              {CENTER_NAME}
            </h1>

            <p>
              Customer & Vehicle
              Reminder System
            </p>
          </div>

        </div>

      </header>

      {/* NAVIGATION */}

      <nav className="navigation">

        <button
          className={
            page === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          className={
            page === "new"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage("new")
          }
        >
          + New Service
        </button>

        <button
          className={
            page === "customers"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage("customers")
          }
        >
          Customers
        </button>

      </nav>

      <main className="main">

        {/* ================================= */}
        {/* DASHBOARD */}
        {/* ================================= */}

        {page === "dashboard" && (
          <>

            <div className="dashboard-cards">

              <Card
                title="Customers"
                value={
                  customerCount
                }
              />

              <Card
                title="Total Services"
                value={
                  records.length
                }
              />

              <Card
                title="Today's Services"
                value={
                  todayCount
                }
              />

              <Card
                title="Today's Revenue"
                value={
                  `₹${todayRevenue.toLocaleString(
                    "en-IN"
                  )}`
                }
              />

              <Card
                title="Monthly Sales"
                value={
                  `₹${monthlySales.toLocaleString(
                    "en-IN"
                  )}`
                }
              />

              <Card
                title="Vehicles"
                value={
                  latestRecords.length
                }
              />

            </div>

            {/* ================================= */}
            {/* DATE-WISE SALES */}
            {/* ================================= */}

            <section className="section">

              <div className="section-heading">

                <div>

                  <h2>
                    Date-wise Sales
                  </h2>

                  <p className="service-help">
                    View total sales for
                    any service date.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <label>

                  Select Date

                  <input
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={
                      (event) =>
                        setSelectedDate(
                          event.target
                            .value
                        )
                    }
                  />

                </label>

                <label>

                  Total Services

                  <input
                    type="text"
                    readOnly
                    value={
                      selectedDateRecords.length
                    }
                  />

                </label>

                <label>

                  Total Sales

                  <input
                    type="text"
                    readOnly
                    value={
                      `₹${selectedDateSales.toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                </label>

              </div>

            </section>

            {/* ================================= */}
            {/* REMINDERS */}
            {/* ================================= */}

            <section className="section">

              <div className="section-heading">

                <div>

                  <h2>
                    Customer Reminders
                  </h2>

                  <p className="service-help">
                    Customers whose
                    reminder is due or
                    coming within the
                    next 30 days.
                  </p>

                </div>

                <div className="reminder-count">
                  {
                    reminderRecords.length
                  }
                </div>

              </div>

              {reminderRecords.length ===
                0 && (
                <div className="empty-reminder">

                  <div className="empty-icon">
                    ✓
                  </div>

                  <strong>
                    No reminders due
                  </strong>

                  <p>
                    There are no
                    customers requiring
                    a reminder in the
                    next 30 days.
                  </p>

                </div>
              )}

              {reminderRecords.map(
                (record) => {

                  const status =
                    getReminderStatus(
                      record.backupReminderDate
                    );

                  return (
                    <div
                      className="reminder-card"
                      key={record._id}
                    >

                      <div>

                        <strong>
                          {
                            record.customerName
                          }
                        </strong>

                        <br />

                        <span>
                          Vehicle:{" "}
                          {
                            record.carNumber
                          }
                        </span>

                        <br />

                        <span>
                          Mobile:{" "}
                          {
                            record.phone
                          }
                        </span>

                      </div>

                      <div>

                        <div>
                          Service Date:{" "}
                          <strong>
                            {formatDate(
                              record.serviceDate
                            )}
                          </strong>
                        </div>

                        <div>
                          Reminder Date:{" "}
                          <strong>
                            {formatDate(
                              record.backupReminderDate
                            )}
                          </strong>
                        </div>

                        <div>
                          Next KM:{" "}
                          <strong>
                            {Number(
                              record.nextCheckKm ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                            {" KM"}
                          </strong>
                        </div>

                      </div>

                      <div>

                        <span
                          className={
                            `reminder-status ${status.className}`
                          }
                        >
                          {
                            status.text
                          }
                        </span>

                      </div>

                      <button
                        className="whatsapp-button"
                        onClick={() =>
                          sendWhatsApp(
                            record.phone,
                            record
                          )
                        }
                      >
                        WhatsApp
                      </button>

                    </div>
                  );
                }
              )}

            </section>

            {/* ================================= */}
            {/* SHOP INFORMATION */}
            {/* ================================= */}

            <section className="section">

              <div>

                <h2>
                  {CENTER_NAME}
                </h2>

                <p>
                  Welcome to your
                  customer reminder
                  system.
                </p>

                <p>
                  <strong>
                    KM Reminder:
                  </strong>{" "}
                  Every 5,000 KM.
                </p>

                <p>
                  <strong>
                    Time Reminder:
                  </strong>{" "}
                  5 months after
                  service.
                </p>

                <p>
                  <strong>
                    Center Contact:
                  </strong>{" "}
                  {CENTER_PHONE}
                </p>

              </div>

            </section>

          </>
        )}

        {/* ================================= */}
        {/* NEW SERVICE */}
        {/* ================================= */}

        {page === "new" && (
          <section className="section">

            <h2>
              Add New Service
            </h2>

            <p className="info-box">

              Enter the customer's
              current odometer
              reading.

              <br />

              The system automatically
              calculates:

              <br />

              <strong>
                Next Check = Current KM
                + 5,000 KM
              </strong>

              <br />

              <strong>
                Reminder Date = Service
                Date + 5 Months
              </strong>

            </p>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-grid">

                <label>

                  Customer Name

                  <input
                    required
                    type="text"
                    value={
                      form.customerName
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          customerName:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

                <label>

                  Customer WhatsApp
                  Number

                  <input
                    required
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={
                      form.phone
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          phone:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

                <label>

                  Car Number

                  <input
                    required
                    type="text"
                    placeholder="MH08BG3910"
                    value={
                      form.carNumber
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          carNumber:
                            event.target
                              .value
                              .toUpperCase(),
                        })
                    }
                  />

                </label>

                <label>

                  Car Model

                  <input
                    type="text"
                    placeholder="Toyota Etios"
                    value={
                      form.carModel
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          carModel:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

                <label>

                  Current KM

                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="95000"
                    value={
                      form.currentKm
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          currentKm:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

                <label>

                  Amount ₹

                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={
                      form.amount
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          amount:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

                <label>

                  Service Date

                  <input
                    type="date"
                    value={
                      form.serviceDate
                    }
                    onChange={
                      (event) =>
                        setForm({
                          ...form,
                          serviceDate:
                            event.target
                              .value,
                        })
                    }
                  />

                </label>

              </div>

              {/* MULTIPLE SERVICES */}

              <div className="services-section">

                <h3>
                  Select Services
                </h3>

                <p className="service-help">
                  Select all services
                  taken by this vehicle
                  during this visit.
                </p>

                <div className="service-options">

                  {SERVICE_OPTIONS.map(
                    (service) => {

                      const selected =
                        form.services.includes(
                          service
                        );

                      return (
                        <label
                          key={service}
                          className={
                            selected
                              ? "service-option selected"
                              : "service-option"
                          }
                        >

                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleService(
                                service
                              )
                            }
                          />

                          <span>
                            {service}
                          </span>

                        </label>
                      );
                    }
                  )}

                </div>

                <div className="selected-services">

                  <strong>
                    Selected Services:
                  </strong>

                  <div>

                    {form.services.map(
                      (service) => (
                        <span
                          className="service-tag"
                          key={service}
                        >
                          {service}
                        </span>
                      )
                    )}

                  </div>

                </div>

              </div>

              <button
                className="save-button"
                type="submit"
              >
                Save Service
              </button>

            </form>

          </section>
        )}

        {/* ================================= */}
        {/* CUSTOMERS */}
        {/* ================================= */}

        {page === "customers" && (
          <section className="section">

            <h2>
              Customers & Vehicles
            </h2>

            <input
              className="search"
              type="text"
              placeholder="Search customer, car number or mobile..."
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Customer
                    </th>

                    <th>
                      Car
                    </th>

                    <th>
                      Services
                    </th>

                    <th>
                      Service Date
                    </th>

                    <th>
                      Current KM
                    </th>

                    <th>
                      Next Check
                    </th>

                    <th>
                      Reminder Date
                    </th>

                    <th>
                      Reminder Status
                    </th>

                    <th>
                      WhatsApp
                    </th>

                    <th>
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRecords.map(
                    (record) => {

                      const status =
                        getReminderStatus(
                          record.backupReminderDate
                        );

                      return (
                        <tr
                          key={
                            record._id
                          }
                        >

                          {/* CUSTOMER */}

                          <td>

                            <strong>
                              {
                                record.customerName
                              }
                            </strong>

                            <br />

                            <small>
                              {
                                record.phone
                              }
                            </small>

                          </td>

                          {/* CAR */}

                          <td>

                            <strong>
                              {
                                record.carNumber
                              }
                            </strong>

                            <br />

                            <small>
                              {
                                record.carModel
                              }
                            </small>

                          </td>

                          {/* SERVICES */}

                          <td>

                            <div className="table-services">

                              {getServices(
                                record
                              ).map(
                                (service) => (
                                  <span
                                    key={
                                      service
                                    }
                                    className="service-tag"
                                  >
                                    {
                                      service
                                    }
                                  </span>
                                )
                              )}

                            </div>

                          </td>

                          {/* SERVICE DATE */}

                          <td>

                            {formatDate(
                              record.serviceDate
                            )}

                          </td>

                          {/* CURRENT KM */}

                          <td>

                            {Number(
                              record.currentKm ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}

                            {" KM"}

                          </td>

                          {/* NEXT KM */}

                          <td>

                            <strong>

                              {Number(
                                record.nextCheckKm ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}

                              {" KM"}

                            </strong>

                          </td>

                          {/* REMINDER DATE */}

                          <td>

                            {formatDate(
                              record.backupReminderDate
                            )}

                          </td>

                          {/* REMINDER STATUS */}

                          <td>

                            <span
                              className={
                                `reminder-status ${status.className}`
                              }
                            >
                              {
                                status.text
                              }
                            </span>

                          </td>

                          {/* WHATSAPP */}

                          <td>

                            <button
                              className="whatsapp-button"
                              onClick={() =>
                                sendWhatsApp(
                                  record.phone,
                                  record
                                )
                              }
                            >
                              WhatsApp
                            </button>

                          </td>

                          {/* AMOUNT */}

                          <td>

                            ₹
                            {Number(
                              record.amount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

// =====================================
// START REACT
// =====================================

createRoot(
  document.getElementById("root")
).render(
  <App />
);
