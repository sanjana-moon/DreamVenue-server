## 🎯 The Real-World Problem

Planning an event—whether it's a dream wedding, a corporate seminar, or a milestone birthday—is incredibly stressful. Traditionally, finding the right venue involves endless phone calls, scattered emails, physical site visits, and disjointed spreadsheets. 

**The core problems event organizers face are:**
1. **Information Overload & Lack of Trust:** It's hard to verify if a venue is actually available, what it truly looks like, or if it fits the budget.
2. **The "Double Booking" Nightmare:** Managing bookings manually often leads to accidental double bookings, causing massive stress for both the customer and the venue owner.
3. **Vendor Visibility:** Independent venue owners struggle to reach a wider audience and manage their bookings efficiently without paying massive commissions to traditional agencies.
4. **Payment Security:** Handling deposits and payments through unsecured channels leaves both parties vulnerable.

**DreamVenue** solves this by providing a centralized, secure, and intuitive platform. We connect customers with verified vendors, provide real-time availability tracking to prevent double bookings, ensure secure payment processing, and give vendors a powerful dashboard to manage their business effortlessly.

---


# DreamVenue Backend API

🔗 **Live Web App:** [https://dream-venue-frontend.vercel.app](https://dream-venue-frontend.vercel.app) *(Update this if your actual frontend URL is different)*  
⚙️ **Live API:** [https://dream-venue-server.vercel.app](https://dream-venue-server.vercel.app) *(Update with your actual Vercel backend link)*  
💻 **Frontend Repo:** [https://github.com/moonlitdreamer/dreamvenue-frontend](https://github.com/moonlitdreamer/dreamvenue-frontend) *(Update with your actual GitHub link)*

---


## 🚀 Features

### For Customers
*   **Advanced Search & Filtering:** Find venues by category, location, price range, capacity, and ratings.
*   **Real-Time Availability:** View exactly which dates are booked to avoid conflicts.
*   **Secure Booking & Checkout:** Integrated payment processing with transaction ID verification.
*   **Verified Reviews:** Only customers with a *completed* booking can leave a review, ensuring 100% genuine feedback.
*   **Personalized Dashboard:** Track upcoming events, total spending, and booking history.

### For Vendors
*   **Venue Management:** Create, update, and manage venue listings.
*   **Booking Control:** Accept, reject, or complete booking requests.
*   **Analytics Dashboard:** Track total earnings, pending requests, and popular venues via interactive charts.
*   **Publishing Control:** Toggle venues between published and unpublished states.

### For Admins
*   **Approval System:** Review and approve/reject newly submitted venues to maintain platform quality.
*   **User Management:** Block/unblock users and promote roles (Customer ➔ Vendor ➔ Admin).
*   **Global Analytics:** Monitor platform revenue, total bookings, and category distribution.
*   **Transaction Ledger:** View all payment histories across the platform.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** MongoDB (Official Driver)
*   **Authentication:** JWT (JSON Web Tokens) via `jose` (integrated with Better Auth)
*   **Architecture:** MVC (Model-View-Controller)
*   **Deployment:** Vercel

---

## 📂 Project Structure (MVC)

```text
dreamvenue-server/
├── src/
│   ├── config/          # Database connection & environment variables
│   ├── controllers/     # Request handling & business logic
│   ├── middleware/      # JWT verification & route protection
│   ├── routes/          # Express route definitions
│   ├── types/           # Global TypeScript interfaces
│   └── index.ts         # App entry point & server initialization
├── .env                 # Environment variables (not committed)
├── package.json
├── tsconfig.json
└── vercel.json