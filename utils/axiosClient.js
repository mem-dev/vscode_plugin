const axios = require("axios");
const config = require("./config");

const axiosInstance = axios.create({
  baseURL: config.baseApiUrl,
  "Content-Type": "application/json"
});

module.exports = axiosInstance;
