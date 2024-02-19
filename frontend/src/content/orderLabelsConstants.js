const courierTypes = ["USPS", "UPS CA", "UPS USA"];

const classTypes = {
  USPS: [
    "Express: 1-2 days",
    "Priority: 1-3 days",
    "Ground Advantage: 1-5 days",
  ],
  "UPS CA": [
    "Express Early: 1 day",
    "Express: 1 day",
    "Express Saver: 1 day",
    "Expedited: 2 days",
    "Standard: Flexible",
  ],
  "UPS USA": [
    "Next Day Air Early: 1 day",
    "Next Day Air: 1 day",
    "2nd Day Air: 2 days",
    "3 Day Select: 3 days",
    "Ground: Min. 3 days",
  ],
};

const pricing = {
  USPS: {
    "Express: 1-2 days": 20,
    "Priority: 1-3 days": 15,
    "Ground Advantage: 1-5 days": 10,
  },
  "UPS CA": {
    "Express Early: 1 day": 25,
    "Express: 1 day": 20,
    "Express Saver: 1 day": 20,
    "Expedited: 2 days": 15,
    "Standard: Flexible": 10,
  },
  "UPS USA": {
    "Next Day Air Early: 1 day": 25,
    "Next Day Air: 1 day": 20,
    "2nd Day Air: 2 days": 15,
    "3 Day Select: 3 days": 10,
    "Ground: Min. 3 days": 10,
  },
};

export { courierTypes, classTypes, pricing };
