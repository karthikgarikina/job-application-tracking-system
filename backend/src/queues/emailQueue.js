const emailQueue = [];

const addToEmailQueue = (emailJob) => {
  emailQueue.push(emailJob);
};

const getNextEmailJob = () => {
  return emailQueue.shift();
};

module.exports = {
  addToEmailQueue,
  getNextEmailJob,
};
