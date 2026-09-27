Smart Parking Management System — Full Project Plan
1. Project Overview
The Smart Parking Management System is a web-based platform where users can:

Find available parking locations

View parking buildings/floors/units

See available and occupied parking slots

Register their vehicle

Book parking by hour or day

Select date and time

Make online payments

Receive a digital booking slip

View booking history

Cancel bookings according to the policy

The system will also have:

Manager Panel — manages assigned parking locations, slots, bookings, users, etc.

Admin Panel — complete system access and management.

Technology
Frontend

HTML5

CSS3

Vanilla JavaScript

Fetch API

Responsive design

Backend

Node.js

Express.js

REST API

JWT Authentication

bcrypt/password hashing

Database

MongoDB + Mongoose

Payment

SSLCommerz / another payment gateway

Optional

Cloudinary for vehicle/user images

Nodemailer for email notifications

QR code generation for booking slips

2. High-Level System Architecture
                    ┌──────────────────────┐
                    │      Customer        │
                    │      Web Browser     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  HTML/CSS/JavaScript │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │      Node.js         │
                    │      Express.js      │
                    │       Backend       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │   MongoDB   │  │   Payment   │  │   Email     │
       │  Database   │  │   Gateway   │  │   Service   │
       └─────────────┘  └─────────────┘  └─────────────┘
3. User Roles
There should be three major roles.

3.1 Customer
Customers can:

Register

Login

Manage profile

Add vehicles

Edit vehicle information

View parking locations

View parking availability

Select parking location

Select floor

Select unit

Select parking slot

Select date

Select duration

Make payment

Receive booking confirmation

View booking history

Cancel booking

Download booking slip

3.2 Manager
A manager manages assigned parking facilities.

Manager can:

Login

View dashboard

Manage assigned parking places

Manage floors

Manage units

Manage parking slots

View availability

View bookings

Approve/reject operational requests where applicable

Check vehicle entry

Check vehicle exit

View customers

View payments

Generate reports

Block/unblock parking slots

A manager should not have access to everything.

Example:

Manager A
   │
   ├── Parking Location A
   │      ├── Floor 1
   │      ├── Floor 2
   │      └── Floor 3
   │
   └── Cannot manage Location B
3.3 Admin
Admin has full access.

Admin can:

Manage users

Manage managers

Manage parking locations

Manage floors

Manage units

Manage slots

Manage bookings

Manage payments

Manage pricing

Manage vehicles

Manage contact messages

Manage managers' permissions

View reports

Manage system settings

Block users

Suspend parking locations

View system logs

4. Landing Page
The landing page should be the public-facing website.

Sections
Navbar
│
├── Home
├── Parking Locations
├── How It Works
├── Features
├── Pricing
├── About
├── Contact
└── Login / Sign Up
5. Hero Section
Example:

Find Your Parking Space
Before You Arrive.

Book secure parking spaces by hour or day.

[ Find Parking ]

Available parking near you
Secure • Easy • Fast
You can have:

Search location

Date

Time

Duration

Example:

Where do you want to park?

[ Dhaka ]

Date
[ 22 Sep 2026 ]

Time
[ 10:00 AM ]

Duration
[ 2 Hours ]

[ Search Parking ]
6. Why Use Our Parking System?
Show benefits such as:

Easy Booking
Book your parking space before reaching the destination.

Real-Time Availability
See which parking slots are available.

Flexible Duration
Book:

Hourly

Daily

Secure Parking
Verified parking locations.

Digital Payment
Pay online securely.

Digital Booking Slip
Receive a booking confirmation immediately.

No Parking Hassle
Know your parking space before you arrive.

7. How It Works
Create a 5-step section.

01
Create Account

↓

02
Add Your Vehicle

↓

03
Find Parking

↓

04
Select Slot & Pay

↓

05
Park Your Vehicle
8. Parking Location Section
Display parking locations.

Example:

Available Parking Locations

┌───────────────────────────────┐
│  [ Parking Image ]            │
│                               │
│  Bashundhara City Parking     │
│  Dhaka                        │
│                               │
│  Available: 38 slots          │
│                               │
│  From ৳50/hour                │
│                               │
│  [ View Parking ]             │
└───────────────────────────────┘
9. Parking Search Page
When users click:

Find Parking
They go to:

/parking
Search:

Location
Date
Start Time
Duration
Vehicle Type
Example:

Location:
[ Bashundhara City ]

Date:
[ 22 September 2026 ]

Start:
[ 02:00 PM ]

Duration:
[ 3 Hours ]

Vehicle:
[ Car ]

[ Search ]
10. Parking Selection Flow
The main booking flow:

Location
   ↓
Floor
   ↓
Unit
   ↓
Parking Slots
   ↓
Date & Time
   ↓
Booking Summary
   ↓
Payment
   ↓
Confirmation
   ↓
Booking Slip
11. Location Selection
Example:

Bashundhara City

Floors

[ Floor 1 ]

[ Floor 2 ]

[ Floor 3 ]

[ Floor 4 ]
Each floor can show:

Available: 42
Occupied: 18
Total: 60
12. Unit Selection
A parking facility may have different units/sections.

Example:

Floor 2

Unit A
Available: 15

Unit B
Available: 8

Unit C
Available: 20
13. Parking Slot Map
This is one of the most important UI components.

Example:

             ENTRY
               ↓

┌─────────────────────────────────┐
│                                 │
│  A01   A02   A03   A04   A05   │
│  🟢    🟢    🔴    🟢    🟡    │
│                                 │
│  A06   A07   A08   A09   A10   │
│  🟢    🔴    🟢    🟢    🟢    │
│                                 │
│──────────── DRIVEWAY ───────────│
│                                 │
│  B01   B02   B03   B04   B05   │
│  🟢    🟢    🟢    🔴    🟢    │
│                                 │
└─────────────────────────────────┘
Legend:

🟢 Available
🔴 Occupied
🟡 Selected
⚫ Disabled
Do not rely only on colors. Add labels/icons/status text for accessibility.

14. Vehicle Management
Before booking, the user should register a vehicle.

Example:

My Vehicles

┌─────────────────────────────┐
│ 🚗 Toyota Corolla           │
│                             │
│ Registration: DHA-XX-1234   │
│ Type: Car                   │
│                             │
│ [ Edit ] [ Delete ]         │
└─────────────────────────────┘

[ + Add Vehicle ]
Vehicle fields:

Vehicle Type
Brand
Model
Color
Registration Number
Vehicle Nickname
Optional:

Vehicle Image
Registration Certificate
15. Vehicle Types
Initially support:

Car
Motorcycle
SUV
Microbus
Pickup
Van
Later:

Truck
Bus
EV
16. Booking Duration
Hourly
1 Hour
2 Hours
3 Hours
4 Hours
...
Daily
1 Day
2 Days
3 Days
...
Later you can add:

Weekly
Monthly
17. Booking Date & Time
Example:

Parking Date

[ 22 September 2026 ]

Start Time

[ 02:00 PM ]

Duration

[ 3 Hours ]
System calculates:

Start:
22 Sep 2026 02:00 PM

End:
22 Sep 2026 05:00 PM
18. Pricing System
Each parking slot/location can have pricing.

Example:

Hourly Price

Car:
৳50/hour

Motorcycle:
৳30/hour

SUV:
৳80/hour
Daily:

Car:
৳500/day

Motorcycle:
৳300/day
You can also have different pricing by:

Location
Floor
Unit
Slot
Vehicle Type
Day
Time
19. Booking Calculation
Example:

Parking:
Bashundhara City

Vehicle:
Toyota Corolla

Slot:
A-25

Date:
22 September 2026

Time:
2:00 PM - 5:00 PM

Duration:
3 Hours

Price:
৳50/hour

Subtotal:
৳150

Service Charge:
৳10

Total:
৳160
20. Booking Confirmation
Before payment:

Booking Summary

Parking:
Bashundhara City

Floor:
Floor 2

Unit:
Unit A

Slot:
A-25

Vehicle:
DHA-XX-1234

Date:
22 Sep 2026

Time:
2:00 PM - 5:00 PM

Amount:
৳160

[ Proceed to Payment ]
21. Payment
Payment flow:

Booking Created
      ↓
Payment Pending
      ↓
Payment Gateway
      ↓
Payment Successful
      ↓
Booking Confirmed
Important: Do not mark a booking as confirmed simply because the frontend says payment succeeded.

The backend should verify the payment with the payment gateway.

22. Booking Status
Use statuses such as:

PENDING_PAYMENT
CONFIRMED
ACTIVE
COMPLETED
CANCELLED
EXPIRED
FAILED
Example:

PENDING_PAYMENT
       ↓
   CONFIRMED
       ↓
     ACTIVE
       ↓
   COMPLETED
Cancellation:

CONFIRMED
    ↓
CANCELLED
23. Booking Slip
After successful payment:

-------------------------------------
        SMART PARKING
       BOOKING RECEIPT
-------------------------------------

Booking ID:
SP-20260922-000124

Customer:
Abdullah

Vehicle:
Toyota Corolla

Registration:
DHA-XX-1234

Parking:
Bashundhara City

Floor:
Floor 2

Unit:
Unit A

Slot:
A-25

Date:
22 September 2026

Time:
02:00 PM - 05:00 PM

Amount:
৳160

Payment:
PAID

-------------------------------------

        [ QR CODE ]

Scan to verify booking

-------------------------------------
Allow:

Download PDF
Print
Share
24. QR Code
The booking slip should contain a QR code.

QR can contain:

Booking ID
Example:

SP-20260922-000124
Manager can scan it to verify:

Booking:
SP-20260922-000124

Status:
CONFIRMED

Vehicle:
DHA-XX-1234

Slot:
A-25

Valid:
22 Sep 2026
02:00 PM - 05:00 PM
25. Customer Dashboard
Route:

/dashboard
Dashboard:

Welcome Abdullah

┌─────────────┐
│ Upcoming    │
│     2       │
└─────────────┘

┌─────────────┐
│ Completed   │
│    18       │
└─────────────┘

┌─────────────┐
│ Vehicles    │
│     3       │
└─────────────┘
Menu:

Dashboard
My Bookings
My Vehicles
Find Parking
Payments
Profile
Notifications
26. My Bookings
Display:

Booking	Location	Slot	Date	Status
SP001	Bashundhara	A25	22 Sep	Confirmed
SP002	Gulshan	B10	25 Sep	Completed
27. Manager Dashboard
Manager dashboard:

Manager Dashboard

Today's Bookings       120
Active Parking          78
Available Slots         42
Today's Revenue      ৳45,000
Charts:

Booking Statistics
Revenue Statistics
Parking Occupancy
Popular Time Slots
28. Manager Menu
Dashboard

Parking
 ├── Locations
 ├── Floors
 ├── Units
 └── Slots

Bookings
Payments
Customers
Vehicles

Entry / Exit

Reports

Profile
29. Parking Management
Manager can see:

Location
Floor
Unit
Slot
Status
Vehicle
Booking
Example:

Slot	Status	Vehicle	Booking
A01	Available	—	—
A02	Occupied	DHA-1234	SP001
A03	Reserved	DHA-5678	SP002
A04	Disabled	—	—
30. Entry & Exit Management
When vehicle enters:

Scan QR
     ↓
Validate Booking
     ↓
Check Date/Time
     ↓
Record Entry
When vehicle leaves:

Scan QR
     ↓
Find Booking
     ↓
Record Exit
     ↓
Calculate actual duration if needed
     ↓
Complete Booking
Database:

entryTime
exitTime
entryManager
exitManager
31. Admin Dashboard
Admin gets:

Total Users
Total Managers
Total Parking Locations
Total Floors
Total Units
Total Slots
Today's Bookings
Today's Revenue
Active Bookings
32. Admin Menu
Dashboard

Users
Managers
Roles & Permissions

Parking
 ├── Locations
 ├── Floors
 ├── Units
 └── Slots

Vehicles
Bookings
Payments

Pricing
Coupons

Contact Messages

Reports

System Settings

Activity Logs
33. Database Design
Recommended collections:

users
vehicles
parkingLocations
floors
units
parkingSlots
bookings
payments
pricingRules
notifications
contactMessages
activityLogs
coupons
34. User Schema
{
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  status: String,
  profileImage: String,

  createdAt: Date,
  updatedAt: Date
}
Role:

CUSTOMER
MANAGER
ADMIN
35. Vehicle Schema
{
  userId: ObjectId,

  vehicleType: String,
  brand: String,
  model: String,
  color: String,
  registrationNumber: String,

  image: String,

  status: String,

  createdAt: Date,
  updatedAt: Date
}
36. Parking Location Schema
{
  name: String,

  address: {
    addressLine: String,
    city: String,
    area: String,
    latitude: Number,
    longitude: Number
  },

  description: String,

  images: [String],

  facilities: [String],

  managerIds: [ObjectId],

  status: String,

  createdAt: Date,
  updatedAt: Date
}
37. Floor Schema
{
  parkingLocationId: ObjectId,

  name: String,

  floorNumber: Number,

  status: String,

  createdAt: Date,
  updatedAt: Date
}
38. Unit Schema
{
  floorId: ObjectId,

  name: String,

  code: String,

  status: String,

  createdAt: Date,
  updatedAt: Date
}
39. Parking Slot Schema
{
  locationId: ObjectId,
  floorId: ObjectId,
  unitId: ObjectId,

  slotNumber: String,

  vehicleTypes: [
    String
  ],

  position: {
    x: Number,
    y: Number
  },

  status: String,

  createdAt: Date,
  updatedAt: Date
}
Status:

AVAILABLE
DISABLED
MAINTENANCE
Do not permanently store OCCUPIED as the primary truth if occupancy is time-based. A slot may be occupied only during particular booking intervals.

40. Booking Schema
This is the most important collection.

{
  bookingNumber: String,

  userId: ObjectId,
  vehicleId: ObjectId,

  locationId: ObjectId,
  floorId: ObjectId,
  unitId: ObjectId,
  slotId: ObjectId,

  startTime: Date,
  endTime: Date,

  durationType: String,
  duration: Number,

  price: Number,
  serviceCharge: Number,
  discount: Number,
  totalAmount: Number,

  paymentStatus: String,
  bookingStatus: String,

  qrCode: String,

  entryTime: Date,
  exitTime: Date,

  createdAt: Date,
  updatedAt: Date
}
41. Payment Schema
{
  bookingId: ObjectId,

  userId: ObjectId,

  transactionId: String,

  gateway: String,

  amount: Number,

  currency: String,

  status: String,

  paidAt: Date,

  gatewayResponse: Object,

  createdAt: Date
}
42. Pricing Schema
{
  locationId: ObjectId,

  vehicleType: String,

  hourlyRate: Number,

  dailyRate: Number,

  active: Boolean,

  createdAt: Date,
  updatedAt: Date
}
Later you can support:

Weekday pricing
Weekend pricing
Peak-hour pricing
Night pricing
Holiday pricing
43. Backend Folder Structure
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── payment.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── ParkingLocation.js
│   │   ├── Floor.js
│   │   ├── Unit.js
│   │   ├── ParkingSlot.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Pricing.js
│   │   └── Notification.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── vehicleController.js
│   │   ├── parkingController.js
│   │   ├── bookingController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── parkingRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── rateLimitMiddleware.js
│   │
│   ├── services/
│   │   ├── bookingService.js
│   │   ├── paymentService.js
│   │   ├── emailService.js
│   │   └── qrService.js
│   │
│   ├── utils/
│   │   ├── generateBookingNumber.js
│   │   ├── generateToken.js
│   │   └── calculatePrice.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
44. Frontend Folder Structure
Since you're using pure HTML/CSS/JS:

frontend/
│
├── index.html
│
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── parking.html
│   ├── parking-details.html
│   ├── booking.html
│   ├── payment.html
│   ├── booking-success.html
│   ├── booking-slip.html
│   │
│   ├── customer/
│   │   ├── dashboard.html
│   │   ├── bookings.html
│   │   ├── vehicles.html
│   │   ├── profile.html
│   │   └── payments.html
│   │
│   ├── manager/
│   │   ├── dashboard.html
│   │   ├── parking.html
│   │   ├── bookings.html
│   │   ├── customers.html
│   │   ├── entry-exit.html
│   │   └── reports.html
│   │
│   └── admin/
│       ├── dashboard.html
│       ├── users.html
│       ├── managers.html
│       ├── locations.html
│       ├── bookings.html
│       ├── payments.html
│       ├── pricing.html
│       ├── reports.html
│       └── settings.html
│
├── css/
│   ├── global.css
│   ├── navbar.css
│   ├── landing.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── parking.css
│   ├── booking.css
│   └── responsive.css
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── navbar.js
│   ├── parking.js
│   ├── booking.js
│   ├── payment.js
│   ├── vehicle.js
│   ├── dashboard.js
│   └── utils.js
│
└── assets/
    ├── images/
    ├── icons/
    └── logos/
45. API Structure
Base URL:

/api
Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
46. User APIs
GET /api/users/me
PUT /api/users/me
PUT /api/users/me/password
47. Vehicle APIs
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
48. Parking APIs
GET /api/parking
GET /api/parking/:id
GET /api/parking/:id/floors
GET /api/floors/:id/units
GET /api/units/:id/slots
Availability:

GET /api/parking/:id/availability
Parameters:

date
startTime
endTime
vehicleType
Example:

/api/parking/123/availability
?date=2026-09-22
&startTime=14:00
&endTime=17:00
&vehicleType=CAR
49. Booking APIs
POST /api/bookings/check-availability

POST /api/bookings

GET /api/bookings

GET /api/bookings/:id

POST /api/bookings/:id/cancel

GET /api/bookings/:id/slip
50. Payment APIs
POST /api/payments/create
POST /api/payments/success
POST /api/payments/fail
POST /api/payments/cancel
POST /api/payments/ipn
GET  /api/payments/:id
51. Manager APIs
GET /api/manager/dashboard

GET /api/manager/bookings

GET /api/manager/customers

GET /api/manager/parking

PUT /api/manager/slots/:id

POST /api/manager/entry

POST /api/manager/exit

GET /api/manager/reports
52. Admin APIs
GET    /api/admin/dashboard

GET    /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/managers
POST   /api/admin/managers
PUT    /api/admin/managers/:id
DELETE /api/admin/managers/:id

POST   /api/admin/parking
PUT    /api/admin/parking/:id
DELETE /api/admin/parking/:id

GET    /api/admin/bookings
GET    /api/admin/payments

POST   /api/admin/pricing
PUT    /api/admin/pricing/:id

GET    /api/admin/reports
53. Authentication
Use:

JWT
+
bcrypt
Login:

Email + Password
       ↓
Backend
       ↓
Validate Password
       ↓
Generate JWT
       ↓
Frontend
For a production application, consider storing authentication in HttpOnly, Secure cookies rather than exposing long-lived JWTs to JavaScript.

54. Role-Based Access Control
Middleware:

requireAuth
requireRole
Example:

router.get(
    "/admin/users",
    requireAuth,
    requireRole("ADMIN"),
    getUsers
);
Manager:

router.get(
    "/manager/bookings",
    requireAuth,
    requireRole("MANAGER", "ADMIN"),
    getBookings
);
Customer:

router.post(
    "/bookings",
    requireAuth,
    requireRole("CUSTOMER"),
    createBooking
);
55. Most Important Part — Slot Availability
The system must prevent two people from booking the same slot at overlapping times.

Suppose:

Slot: A01

Booking 1:
10:00 → 12:00
User tries:

11:00 → 13:00
This must be rejected.

A common overlap condition is:

existing.startTime < requested.endTime
AND
existing.endTime > requested.startTime
Do this check on the server, immediately before creating/confirming the booking.

56. Temporary Slot Reservation
Payment can take time.

Therefore, don't let a slot remain permanently free while someone is paying.

Use:

AVAILABLE
     ↓
TEMPORARILY RESERVED
     ↓
PAYMENT
     ↓
CONFIRMED
Example:

User selects A01

A01
↓
Hold for 10 minutes
↓
Payment
↓
Success → CONFIRMED

Failure/timeout
↓
AVAILABLE
This greatly reduces double-booking problems.

57. Booking State Machine
                ┌──────────────┐
                │   CREATED    │
                └──────┬───────┘
                       │
                       ▼
              ┌─────────────────┐
              │ PAYMENT_PENDING │
              └───────┬─────────┘
                      │
             ┌────────┴────────┐
             ▼                 ▼
        PAYMENT FAILED     PAYMENT SUCCESS
             │                 │
             ▼                 ▼
          EXPIRED          CONFIRMED
                               │
                               ▼
                             ACTIVE
                               │
                               ▼
                           COMPLETED
58. Notifications
Notify users when:

Registration successful
Booking created
Payment successful
Booking confirmed
Booking cancelled
Parking time approaching
Parking expired
Channels:

Website notification
Email
SMS
Start with email/web notifications and add SMS later.

59. Contact System
Landing page:

Contact Us

Name
Email
Phone
Subject
Message

[ Send Message ]
Save to:

contactMessages
Admin can see:

New
In Progress
Resolved
Closed
60. Search & Filter
Admin/Manager should be able to filter:

Booking
Booking ID
Customer
Vehicle
Location
Date
Status
Payment Status
User
Name
Email
Phone
Status
Parking
Location
Floor
Unit
Slot
Status
61. Reports
Manager/Admin should have reports.

Booking Report
Total bookings
Confirmed bookings
Cancelled bookings
Completed bookings
Revenue Report
Daily revenue
Weekly revenue
Monthly revenue
Parking Report
Total slots
Average occupancy
Peak hours
Most booked location
62. Dashboard Analytics
For example:

         Today's Revenue

             ৳52,450
Bookings
│
│       █
│       █
│   █   █
│   █   █   █
│ █ █   █   █
└────────────────
  9  10  11  12
Use a small chart library only if you want; otherwise you can create simple charts with CSS/SVG/Canvas.

63. Security Requirements
This is extremely important because you're handling:

User information

Vehicle information

Booking data

Payment information

Implement:

Password hashing
JWT/session security
Role-based authorization
Input validation
Rate limiting
CORS
Helmet
HTTPS
MongoDB injection protection
XSS protection
CSRF protection where applicable
Secure cookies
Environment variables
Never store:

Raw password
Never trust:

Price from frontend
Slot availability from frontend
User role from frontend
Payment success from frontend
The backend must calculate and validate these.

64. Environment Variables
Example:

PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret

PAYMENT_STORE_ID=your_store_id
PAYMENT_STORE_PASSWORD=your_password

FRONTEND_URL=https://yourdomain.com

SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
Never commit .env to Git.

65. Frontend API Configuration
Create:

js/config.js
Example:

const API_BASE_URL =
    "http://localhost:5000/api";
Production:

const API_BASE_URL =
    "https://api.yourdomain.com/api";
66. Frontend API Helper
Create:

js/api.js
Example:

async function apiRequest(url, options = {}) {

    const response = await fetch(
        API_BASE_URL + url,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
}
67. Recommended Development Order
Do not build everything simultaneously.

Build in phases.

Phase 1 — Project Setup
Frontend
Landing page
Navbar
Footer
Responsive layout
Login
Registration
Backend
Node.js
Express
MongoDB
Environment configuration
Basic API
68. Phase 2 — Authentication
Build:

Register
Login
Logout
Profile
JWT authentication
Role-based authorization
Test:

Customer
Manager
Admin
69. Phase 3 — Vehicle Management
Build:

Add vehicle
Edit vehicle
Delete vehicle
View vehicles
70. Phase 4 — Parking Structure
Admin creates:

Parking Location
       ↓
Floor
       ↓
Unit
       ↓
Parking Slot
Example:

Bashundhara City
│
├── Floor 1
│   ├── Unit A
│   │   ├── A01
│   │   ├── A02
│   │   └── A03
│   │
│   └── Unit B
│
└── Floor 2
    ├── Unit A
    └── Unit B
71. Phase 5 — Availability System
Implement:

Date
Start Time
End Time
Vehicle Type
Slot availability
This should be thoroughly tested before payment integration.

72. Phase 6 — Booking System
Build:

Select parking
Select floor
Select unit
Select slot
Select vehicle
Select date
Select duration
Calculate price
Create booking
73. Phase 7 — Payment
Integrate:

SSLCommerz
Flow:

Booking
 ↓
Payment Session
 ↓
SSLCommerz
 ↓
Success
 ↓
Backend Verification
 ↓
Booking Confirmed
 ↓
Receipt
74. Phase 8 — Booking Slip
Generate:

Booking number
Customer
Vehicle
Parking
Floor
Unit
Slot
Date
Time
Amount
Payment status
QR code
Allow:

PDF
Print
75. Phase 9 — Manager Panel
Build:

Dashboard
Bookings
Parking
Customers
Entry
Exit
Reports
76. Phase 10 — Admin Panel
Build:

Users
Managers
Parking
Bookings
Payments
Pricing
Reports
Settings
77. Phase 11 — Notifications
Add:

Email confirmation
Booking reminder
Cancellation email
Payment receipt
78. Phase 12 — Security & Testing
Test:

Authentication
Authorization
Booking conflicts
Payment callbacks
Expired reservations
Cancellation
Concurrent bookings
Invalid input
API security
79. Phase 13 — Deployment
Possible architecture:

Frontend
   │
   ▼
Static Hosting
   │
   ▼
HTML/CSS/JS

Backend
   │
   ▼
Node.js / Express
   │
   ▼
Vercel / VPS / Render

Database
   │
   ▼
MongoDB Atlas
80. Final User Flow
                  LANDING PAGE
                       │
                       ▼
                Find Parking
                       │
                       ▼
                  Login/Signup
                       │
                       ▼
                Add Vehicle
                       │
                       ▼
              Select Location
                       │
                       ▼
                  Select Floor
                       │
                       ▼
                   Select Unit
                       │
                       ▼
                Select Date/Time
                       │
                       ▼
                Show Slot Map
                       │
                       ▼
                  Select Slot
                       │
                       ▼
                Booking Summary
                       │
                       ▼
                  Payment
                       │
                       ▼
             Payment Verification
                       │
                       ▼
              Booking Confirmed
                       │
                       ▼
                Booking Slip
                       │
                       ▼
                     QR Code
81. Manager Flow
Manager Login
     │
     ▼
Dashboard
     │
     ├── Bookings
     │
     ├── Parking
     │    ├── Floors
     │    ├── Units
     │    └── Slots
     │
     ├── Customers
     │
     ├── Vehicle Entry
     │
     ├── Vehicle Exit
     │
     └── Reports
82. Admin Flow
Admin Login
     │
     ▼
Admin Dashboard
     │
     ├── Users
     ├── Managers
     ├── Roles
     ├── Parking Locations
     ├── Floors
     ├── Units
     ├── Slots
     ├── Bookings
     ├── Payments
     ├── Pricing
     ├── Reports
     ├── Contact Messages
     ├── Notifications
     └── System Settings
83. MVP — First Version
Don't try to build every feature immediately.

Your Version 1 should contain:

Public
Landing page

Parking locations

Contact

Login

Registration

Customer
Dashboard

Vehicle management

Parking search

Floor/unit selection

Slot availability

Hourly/daily booking

Payment

Booking confirmation

Booking slip

Manager
Dashboard

Parking management

Booking management

Customer view

Entry/exit

Admin
Dashboard

User management

Manager management

Parking management

Booking management

Payment management

Pricing management

That is already a substantial project.

84. Version 2 Features
After the core system works, add:

QR Code Entry
QR Code Exit
Email notifications
SMS notifications
Coupons
Discounts
Reviews
Favorite parking
Google Maps
Nearby parking
Advanced reports
Revenue analytics
Peak-hour pricing
Monthly parking
Corporate accounts
85. Version 3 — Smart Parking
Later, you can turn it into a genuinely smart parking platform.

Possible features:

IoT parking sensors
        ↓
Real-time slot detection
        ↓
Backend
        ↓
Live availability
        ↓
Customer
For example:

A01
Sensor → Occupied

A02
Sensor → Free

A03
Sensor → Free
The website could then show:

Floor 2

🟢 A01 Available
🔴 A02 Occupied
🟢 A03 Available
🟢 A04 Available
You could also add:

Automatic number plate recognition

Camera integration

QR gate access

IoT sensors

Smart barrier gates

Digital signage

EV charging management

86. Suggested Main Pages
PUBLIC
────────────────────────
/
 /about
 /parking
 /parking-details
 /contact
 /login
 /register


CUSTOMER
────────────────────────
/dashboard
/dashboard/bookings
/dashboard/vehicles
/dashboard/payments
/dashboard/profile
/dashboard/notifications


MANAGER
────────────────────────
/manager
/manager/bookings
/manager/parking
/manager/customers
/manager/entry-exit
/manager/reports


ADMIN
────────────────────────
/admin
/admin/users
/admin/managers
/admin/parking
/admin/bookings
/admin/payments
/admin/pricing
/admin/reports
/admin/settings
87. Recommended Core Components
Even though you're using pure HTML/CSS/JS, keep reusable UI components conceptually organized:

Navbar
Footer
Modal
Toast
Loading Spinner
Confirmation Dialog
Data Table
Pagination
Search Box
Filter
Status Badge
Parking Slot
Parking Map
Booking Card
Vehicle Card
Payment Modal
Booking Slip
Example parking slot:

<button
    class="parking-slot available"
    data-slot-id="A01">

    <span class="slot-number">
        A01
    </span>

    <span class="slot-status">
        Available
    </span>

</button>
JavaScript can dynamically generate all slots.

88. Most Important Business Rules
Define these before coding.

Rule 1
A customer cannot book a slot that overlaps another confirmed/held booking.

Rule 2
A customer must have a registered vehicle before booking.

Rule 3
A vehicle can only use compatible parking slots.

Rule 4
Payment must be verified server-side.

Rule 5
A temporary booking expires after a fixed period if payment isn't completed.

Rule 6
Managers can only manage assigned parking locations.

Rule 7
Admins have global access.

Rule 8
A cancelled booking releases its slot.

Rule 9
Completed bookings cannot be modified.

Rule 10
Price must be calculated by the backend.

89. Recommended Database Relationship
USER
 │
 ├───────────────┐
 │               │
 ▼               ▼
VEHICLE       BOOKINGS
                  │
                  │
       ┌──────────┼───────────┐
       ▼          ▼           ▼
 LOCATION       FLOOR        SLOT
       │          │           │
       └──────────┼───────────┘
                  │
                  ▼
               PAYMENT
90. Final Technology Stack
Frontend
──────────────
HTML5
CSS3
JavaScript ES6+
Fetch API


Backend
──────────────
Node.js
Express.js


Database
──────────────
MongoDB
Mongoose


Authentication
──────────────
JWT
bcrypt


Payment
──────────────
SSLCommerz


Communication
──────────────
Nodemailer
SMS Gateway (later)


Files
──────────────
Cloudinary (optional)


QR
──────────────
QR Code Generator


Deployment
──────────────
Frontend → Static hosting
Backend  → Vercel/VPS
Database → MongoDB Atlas
91. Recommended Build Sequence
If you're building this yourself, use this order:

1. Database design
        ↓
2. Node/Express setup
        ↓
3. Authentication
        ↓
4. User + Vehicle
        ↓
5. Parking Location
        ↓
6. Floor + Unit + Slot
        ↓
7. Availability algorithm
        ↓
8. Booking system
        ↓
9. Payment
        ↓
10. Booking slip / QR
        ↓
11. Manager panel
        ↓
12. Admin panel
        ↓
13. Landing page polish
        ↓
14. Security testing
        ↓
15. Deployment
The availability + booking + payment consistency is the heart of this project. Once those three pieces are correctly designed, the landing page and dashboards become much easier to build around them.
