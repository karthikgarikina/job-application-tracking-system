const ALLOWED_TRANSITIONS = {
  APPLIED: ["SCREENING", "REJECTED"],
  SCREENING: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

const canTransition = (fromStage, toStage) => {
  return ALLOWED_TRANSITIONS[fromStage]?.includes(toStage);
};

module.exports = { canTransition };
