const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000;
const ist = new Date(now.getTime() + istOffset);
const day = ist.getUTCDay();
const hour = ist.getUTCHours();
const minute = ist.getUTCMinutes();
const timeInMinutes = hour * 60 + minute;

console.log("Current Time (UTC):", now.toUTCString());
console.log("Simulated IST:", ist.toUTCString());
console.log("Day:", day);
console.log("Hour:", hour);
console.log("Minute:", minute);
console.log("Time in Minutes:", timeInMinutes);
console.log("Market Open?", (day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930));
